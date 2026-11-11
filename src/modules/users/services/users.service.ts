import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { TeacherEntity } from '../entities/teacher.entity';
import { StudentEntity } from '../entities/student.entity';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { StudentGroupEntity } from 'src/modules/student-groups/entities/student-group.entity';
import { DepartmentEntity } from 'src/modules/departments/entities/department.entity';
import { AuthorityService } from 'src/modules/roles/services/authority.service';
import { PasswordService } from 'src/modules/auth/services/password.service';
import { UsersMapper } from '../mappers/user.mapper';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { IUserListItemModel } from '../models/user-list-item.model';
import { IUserItemModel } from '../models/user-item.model';
import { IGetUsersFiltersModel } from '../models/get-users-filters.model';
import { UserProfileType } from '../models/user-profile-type.enum';
import { ICreateUserModel } from '../models/create-user.model';
import { IEditUserModel } from '../models/edit-user.model';
import { ICreateStudentProfileModel } from '../models/create-student-profile.model';
import { IEditStudentProfileModel } from '../models/edit-student-profile.model';
import { ICreateTeacherProfileModel } from '../models/create-teacher-profile.model';
import { IEditTeacherProfileModel } from '../models/edit-teacher-profile.model';
import { ITeacherProfileModel } from '../models/teacher-profile.model';
import { IStudentProfileModel } from '../models/student-profile.model';
import { ITeacherDictionaryItem } from '../models/teacher-dictionary-item.model';
import { randomBytes } from 'crypto';

/** Changes to another user's account and profiles follow the role hierarchy, see AuthorityService. */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    @InjectRepository(TeacherEntity)
    private teachersRepository: Repository<TeacherEntity>,
    @InjectRepository(StudentEntity)
    private studentsRepository: Repository<StudentEntity>,
    @InjectRepository(StudentGroupEntity)
    private studentGroupsRepository: Repository<StudentGroupEntity>,
    @InjectRepository(DepartmentEntity)
    private departmentsRepository: Repository<DepartmentEntity>,
    private readonly usersMapper: UsersMapper,
    private readonly authorityService: AuthorityService,
    private readonly passwordService: PasswordService,
  ) {}

  async getTeachersDictionary(): Promise<ITeacherDictionaryItem[]> {
    const teachers = await this.teachersRepository.find({
      relations: { user: true, },
      order: { user: { fullName: 'ASC', }, },
    });
    return teachers.map(
      (t) => this.usersMapper.teacherToDictionaryItem(t)
    );
  }

  async getAll(params: IGetUsersFiltersModel, actorId: string): Promise<IGenericListPayloadResponse<IUserListItemModel>> {
    const { page, pageSize, search, roleIds, profiles, } = params;
    const usersQb = this.usersRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.roles', 'roles')
      .leftJoinAndSelect('users.teacher', 'teacher')
      .leftJoinAndSelect('users.student', 'student')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      usersQb.andWhere('(users.fullName ILIKE :search OR users.email ILIKE :search)', { search: `%${search}%`, });
    }

    if (roleIds?.length) {
      // a subquery, so the joined roles still list all the user's roles, not only the matched ones
      usersQb.andWhere(
        'EXISTS (SELECT 1 FROM user_roles ur WHERE ur."userId" = users.id AND ur."roleId" IN (:...roleIds))',
        { roleIds, },
      );
    }

    if (profiles?.length) {
      usersQb.andWhere(new Brackets((qb) => {
        if (profiles.includes(UserProfileType.Teacher)) {
          qb.orWhere('teacher.id IS NOT NULL');
        }
        if (profiles.includes(UserProfileType.Student)) {
          qb.orWhere('student.id IS NOT NULL');
        }
        if (profiles.includes(UserProfileType.None)) {
          qb.orWhere('(teacher.id IS NULL AND student.id IS NULL)');
        }
      }));
    }

    const [[usersData, total], actor] = await Promise.all([
      usersQb.distinct(true).getManyAndCount(),
      this.authorityService.getAuthority(actorId),
    ]);

    return {
      items: usersData.map(
        (u) => this.usersMapper.entityToListItem(
          u,
          this.authorityService.canManageUser(actor, this.authorityService.fromRoles(u.id, u.roles)),
        )
      ),
      meta: { count: total, },
    };
  }

  async getById(id: string, actorId: string): Promise<IUserItemModel> {
    const [user, actor] = await Promise.all([
      this.usersRepository.findOneOrFail({
        where: { id, },
        relations: { roles: true, teacher: true, student: true, },
      }),
      this.authorityService.getAuthority(actorId),
    ]);
    const canManage = this.authorityService.canManageUser(actor, this.authorityService.fromRoles(user.id, user.roles));
    return this.usersMapper.entityToItem(user, canManage);
  }

  async createUser(data: ICreateUserModel, actorId: string): Promise<IUserItemModel> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: data.email, },
    });
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    const roles = await this.findRoles(data.roleIds);
    const actor = await this.authorityService.getAuthority(actorId);
    this.authorityService.assertCanManageRoles(actor, roles);

    if (data.student?.studentGroupId) {
      await this.studentGroupsRepository.findOneOrFail({
        where: { id: data.student.studentGroupId, },
      });
    }

    if (data.teacher?.departmentId) {
      await this.departmentsRepository.findOneOrFail({
        where: { id: data.teacher.departmentId, },
      });
    }

    const password = data.password ?? randomBytes(24).toString('base64url');
    const hashedPassword = await this.passwordService.hash(password);

    const newUser = this.usersRepository.create({
      email: data.email,
      fullName: data.fullName,
      password: hashedPassword,
      roles,
    });
    const createdUser = await this.usersRepository.save(newUser);

    if (data.teacher) {
      await this.insertTeacherProfile(createdUser.id, data.teacher);
    }

    if (data.student) {
      await this.insertStudentProfile(createdUser.id, data.student);
    }

    return this.getById(createdUser.id, actorId);
  }

  async editUser(userId: string, data: IEditUserModel, actorId: string): Promise<IUserItemModel> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id: userId, },
      relations: { roles: true, },
    });
    const actor = await this.authorityService.getAuthority(actorId);
    this.authorityService.assertCanManageUser(actor, this.authorityService.fromRoles(user.id, user.roles));

    if (data.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: data.email, },
      });
      if (existingUser) {
        throw new BadRequestException('Email is already in use');
      }
    }

    if (data.roleIds) {
      const roles = await this.findRoles(data.roleIds);
      const currentRoleIds = new Set(user.roles.map((role) => role.id));
      const nextRoleIds = new Set(roles.map((role) => role.id));
      // both granting and taking away a role are checked
      const changedRoles = [
        ...roles.filter((role) => !currentRoleIds.has(role.id)),
        ...user.roles.filter((role) => !nextRoleIds.has(role.id)),
      ];
      this.authorityService.assertCanManageRoles(actor, changedRoles);
      user.roles = roles;
    }

    user.email = data.email;
    user.fullName = data.fullName;
    await this.usersRepository.save(user);

    return this.getById(userId, actorId);
  }

  async createTeacherProfile(userId: string, data: ICreateTeacherProfileModel, actorId: string): Promise<ITeacherProfileModel> {
    await this.assertCanManageUser(actorId, userId);
    return this.insertTeacherProfile(userId, data);
  }

  /** Creates the profile when the user has none */
  async editTeacherProfile(userId: string, data: IEditTeacherProfileModel, actorId: string): Promise<ITeacherProfileModel> {
    await this.assertCanManageUser(actorId, userId);

    const teacherProfile = await this.teachersRepository.findOne({
      where: { userId, },
    });
    if (!teacherProfile) {
      return this.insertTeacherProfile(userId, data);
    }

    if (data.departmentId !== undefined) {
      if (data.departmentId) {
        await this.departmentsRepository.findOneOrFail({
          where: { id: data.departmentId, },
        });
      }
      if (teacherProfile.departmentId && teacherProfile.departmentId !== data.departmentId) {
        // a head who leaves the department stops being its head
        await this.departmentsRepository.update(
          { id: teacherProfile.departmentId, headTeacherId: teacherProfile.id, },
          { headTeacherId: null, },
        );
      }
      teacherProfile.departmentId = data.departmentId ?? null;
    }

    const updatedProfile = await this.teachersRepository.save(teacherProfile);
    return this.usersMapper.teacherProfileToItem(updatedProfile);
  }

  async deleteTeacherProfile(userId: string, actorId: string): Promise<ITeacherProfileModel> {
    await this.assertCanManageUser(actorId, userId);
    const teacherProfile = await this.teachersRepository.findOneOrFail({
      where: { userId, },
    });
    const removedProfile = await this.teachersRepository.remove(teacherProfile);
    return this.usersMapper.teacherProfileToItem(removedProfile);
  }

  async createStudentProfile(userId: string, data: ICreateStudentProfileModel, actorId: string): Promise<IStudentProfileModel> {
    await this.assertCanManageUser(actorId, userId);
    return this.insertStudentProfile(userId, data);
  }

  /** Creates the profile when the user has none */
  async editStudentProfile(userId: string, data: IEditStudentProfileModel, actorId: string): Promise<IStudentProfileModel> {
    await this.assertCanManageUser(actorId, userId);

    const studentProfile = await this.studentsRepository.findOne({
      where: { userId, },
    });
    if (!studentProfile) {
      return this.insertStudentProfile(userId, data);
    }

    if (data.studentGroupId !== undefined) {
      if (data.studentGroupId) {
        await this.studentGroupsRepository.findOneOrFail({
          where: { id: data.studentGroupId, },
        });
      }
      studentProfile.studentGroupId = data.studentGroupId ?? null;
    }
    if (data.isGroupMonitor !== undefined) {
      studentProfile.isGroupMonitor = data.isGroupMonitor;
    }

    const updatedProfile = await this.studentsRepository.save(studentProfile);
    return this.usersMapper.studentProfileToItem(updatedProfile);
  }

  async deleteStudentProfile(userId: string, actorId: string): Promise<IStudentProfileModel> {
    await this.assertCanManageUser(actorId, userId);
    const studentProfile = await this.studentsRepository.findOneOrFail({
      where: { userId, },
    });
    const removedProfile = await this.studentsRepository.remove(studentProfile);
    return this.usersMapper.studentProfileToItem(removedProfile);
  }

  async getUserById(id: string): Promise<UserEntity | null> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['roles',],
    });
    return user;
  }
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.usersRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  async assertCanManageUser(actorId: string, targetUserId: string): Promise<void> {
    const [actor, target] = await Promise.all([
      this.authorityService.getAuthority(actorId),
      this.authorityService.getAuthority(targetUserId),
    ]);
    this.authorityService.assertCanManageUser(actor, target);
  }

  private async insertTeacherProfile(userId: string, data: ICreateTeacherProfileModel): Promise<ITeacherProfileModel> {
    const existingProfile = await this.teachersRepository.findOne({
      where: { userId, },
    });
    if (existingProfile) {
      throw new BadRequestException('Teacher profile already exists for this user');
    }

    if (data.departmentId) {
      await this.departmentsRepository.findOneOrFail({
        where: { id: data.departmentId, },
      });
    }

    const teacherProfile = this.teachersRepository.create({
      userId,
      departmentId: data.departmentId ?? null,
    });
    const createdProfile = await this.teachersRepository.save(teacherProfile);
    return this.usersMapper.teacherProfileToItem(createdProfile);
  }

  private async insertStudentProfile(userId: string, data: ICreateStudentProfileModel): Promise<IStudentProfileModel> {
    const existingProfile = await this.studentsRepository.findOne({
      where: { userId, },
    });
    if (existingProfile) {
      throw new BadRequestException('Student profile already exists for this user');
    }

    if (data.studentGroupId) {
      await this.studentGroupsRepository.findOneOrFail({
        where: { id: data.studentGroupId, },
      });
    }

    const studentProfile = this.studentsRepository.create({
      userId,
      studentGroupId: data.studentGroupId ?? null,
      isGroupMonitor: data.isGroupMonitor ?? false,
    });
    const createdProfile = await this.studentsRepository.save(studentProfile);
    return this.usersMapper.studentProfileToItem(createdProfile);
  }

  private async findRoles(roleIds: string[] = []): Promise<RoleEntity[]> {
    if (roleIds.length === 0) {
      return [];
    }
    return await this.rolesRepository.find({
      where: { id: In(roleIds), },
    });
  }
}
