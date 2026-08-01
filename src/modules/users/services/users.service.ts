import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { TeacherEntity } from '../entities/teacher.entity';
import { StudentEntity } from '../entities/student.entity';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { StudentGroupEntity } from 'src/modules/student-groups/entities/student-group.entity';
import { RolesService } from 'src/modules/roles/services/roles.service';
import { PasswordService } from 'src/modules/auth/services/password.service';
import { UsersMapper } from '../mappers/user.mapper';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { IUserListItemModel } from '../models/user-list-item.model';
import { IUserItemModel } from '../models/user-item.model';
import { IGetUsersFiltersModel } from '../models/get-users-filters.model';
import { ICreateUserModel } from '../models/create-user.model';
import { ICreateStudentProfileModel } from '../models/create-student-profile.model';
import { IEditStudentProfileModel } from '../models/edit-student-profile.model';
import { ITeacherProfileModel } from '../models/teacher-profile.model';
import { IStudentProfileModel } from '../models/student-profile.model';
import { randomBytes } from 'crypto';

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
    private readonly usersMapper: UsersMapper,
    private readonly rolesService: RolesService,
    private readonly passwordService: PasswordService,
  ) {}

  async getAll(params: IGetUsersFiltersModel): Promise<IGenericListPayloadResponse<IUserListItemModel>> {
    const { page, pageSize, search, } = params;
    const usersQb = this.usersRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.roles', 'roles')
      .leftJoinAndSelect('users.teacher', 'teacher')
      .leftJoinAndSelect('users.student', 'student')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (search) {
      usersQb.andWhere('(users.fullName LIKE :search OR users.email LIKE :search)', { search, });
    }

    const [usersData, total] = await usersQb
      .distinct(true)
      .getManyAndCount();

    return {
      items: usersData.map(
        (u) => this.usersMapper.entityToListItem(u)
      ),
      meta: { count: total, },
    };
  }

  async getById(id: string): Promise<IUserItemModel> {
    const user = await this.usersRepository.findOneOrFail({
      where: { id, },
      relations: { roles: true, teacher: true, student: true, },
    });
    return this.usersMapper.entityToItem(user);
  }

  async createUser(data: ICreateUserModel, creatingUserId: string): Promise<IUserItemModel> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: data.email, },
    });
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    let roles: RoleEntity[] = [];
    if (data.roleIds && data.roleIds.length > 0) {
      roles = await this.rolesRepository.find({
        where: { id: In(data.roleIds), },
      });
      const creatingUser = await this.usersRepository.findOneOrFail({
        where: { id: creatingUserId, },
        relations: { roles: true, },
      });
      const grantedPermissions = [...new Set(roles.flatMap((role) => role.permissions))];
      await this.rolesService.checkUserRoleManageAccess(grantedPermissions, creatingUser);
    }

    if (data.student?.studentGroupId) {
      await this.studentGroupsRepository.findOneOrFail({
        where: { id: data.student.studentGroupId, },
      });
    }

    const generatedPassword = randomBytes(24).toString('base64url');
    const hashedPassword = await this.passwordService.hash(generatedPassword);

    const newUser = this.usersRepository.create({
      email: data.email,
      fullName: data.fullName,
      password: hashedPassword,
      roles,
    });
    const createdUser = await this.usersRepository.save(newUser);

    if (data.teacher) {
      const teacherProfile = this.teachersRepository.create({
        userId: createdUser.id,
      });
      await this.teachersRepository.save(teacherProfile);
    }

    if (data.student) {
      const studentProfile = this.studentsRepository.create({
        userId: createdUser.id,
        studentGroupId: data.student.studentGroupId ?? null,
        isGroupMonitor: data.student.isGroupMonitor ?? false,
      });
      await this.studentsRepository.save(studentProfile);
    }

    return this.getById(createdUser.id);
  }

  async createTeacherProfile(userId: string): Promise<ITeacherProfileModel> {
    await this.usersRepository.findOneOrFail({
      where: { id: userId, },
    });

    const existingProfile = await this.teachersRepository.findOne({
      where: { userId, },
    });
    if (existingProfile) {
      throw new BadRequestException('Teacher profile already exists for this user');
    }

    const teacherProfile = this.teachersRepository.create({ userId, });
    const createdProfile = await this.teachersRepository.save(teacherProfile);
    return this.usersMapper.teacherProfileToItem(createdProfile);
  }

  async deleteTeacherProfile(userId: string): Promise<ITeacherProfileModel> {
    const teacherProfile = await this.teachersRepository.findOneOrFail({
      where: { userId, },
    });
    const removedProfile = await this.teachersRepository.remove(teacherProfile);
    return this.usersMapper.teacherProfileToItem(removedProfile);
  }

  async createStudentProfile(userId: string, data: ICreateStudentProfileModel): Promise<IStudentProfileModel> {
    await this.usersRepository.findOneOrFail({
      where: { id: userId, },
    });

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

  async editStudentProfile(userId: string, data: IEditStudentProfileModel): Promise<IStudentProfileModel> {
    const studentProfile = await this.studentsRepository.findOneOrFail({
      where: { userId, },
    });

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

  async deleteStudentProfile(userId: string): Promise<IStudentProfileModel> {
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
}
