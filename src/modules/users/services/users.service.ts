import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { RoleEntity } from 'src/modules/roles/entities/role.entity';
import { RolesService } from 'src/modules/roles/services/roles.service';
import { PasswordService } from 'src/modules/auth/services/password.service';
import { UsersMapper } from '../mappers/user.mapper';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { IUserListItemModel } from '../models/user-list-item.model';
import { IUserItemModel } from '../models/user-item.model';
import { IGetUsersFiltersModel } from '../models/get-users-filters.model';
import { ICreateUserModel } from '../models/create-user.model';
import { randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private rolesRepository: Repository<RoleEntity>,
    private readonly usersMapper: UsersMapper,
    private readonly rolesService: RolesService,
    private readonly passwordService: PasswordService,
  ) {}

  async getAll(params: IGetUsersFiltersModel): Promise<IGenericListPayloadResponse<IUserListItemModel>> {
    const { page, pageSize, search, } = params;
    const usersQb = this.usersRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.roles', 'roles')
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
      relations: { roles: true, },
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

    const generatedPassword = randomBytes(24).toString('base64url');
    const hashedPassword = await this.passwordService.hash(generatedPassword);

    const newUser = this.usersRepository.create({
      email: data.email,
      fullName: data.fullName,
      password: hashedPassword,
      roles,
    });
    const createdUser = await this.usersRepository.save(newUser);
    return this.usersMapper.entityToItem(createdUser);
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
