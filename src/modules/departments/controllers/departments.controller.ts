import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from 'src/modules/auth/guards/access-refresh.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permission.guard';
import { Permissions } from 'src/modules/auth/decorator/roles.decorator';
import { Permission } from 'src/shared/models/permission.enum';
import { IGenericListPayloadResponse } from 'src/shared/models/generic-list-payload.response';
import { DepartmentsService } from '../services/departments.service';
import { GetDepartmentsRequestDto } from '../dto/get-departments-request.dto';
import { CreateDepartmentRequestDto } from '../dto/create-department-request.dto';
import { EditDepartmentRequestDto } from '../dto/edit-department-request.dto';
import { IDepartmentListItemModel } from '../models/department-list-item.model';
import { IDepartmentItemModel } from '../models/department-item.model';

@ApiTags('Departments')
@Controller('api/departments')
export class DepartmentsController {
  constructor(
    private readonly departmentsService: DepartmentsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_DEPARTMENTS, Permission.MANAGE_DEPARTMENTS, Permission.ADMIN)
  async getAllDepartments(@Query() params: GetDepartmentsRequestDto): Promise<IGenericListPayloadResponse<IDepartmentListItemModel>> {
    return await this.departmentsService.getAll(params);
  }

  @Get(':departmentId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_DEPARTMENTS, Permission.MANAGE_DEPARTMENTS, Permission.ADMIN)
  async getDepartment(@Param('departmentId') departmentId: string): Promise<IDepartmentItemModel> {
    return await this.departmentsService.getById(departmentId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_DEPARTMENTS, Permission.ADMIN)
  async createDepartment(@Body() data: CreateDepartmentRequestDto): Promise<IDepartmentItemModel> {
    return await this.departmentsService.createDepartment(data);
  }

  @Put(':departmentId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_DEPARTMENTS, Permission.ADMIN)
  async editDepartment(@Param('departmentId') departmentId: string, @Body() data: EditDepartmentRequestDto): Promise<boolean> {
    return await this.departmentsService.editDepartment(data, departmentId);
  }

  @Delete(':departmentId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_DEPARTMENTS, Permission.ADMIN)
  async deleteDepartment(@Param('departmentId') departmentId: string): Promise<IDepartmentItemModel> {
    return await this.departmentsService.deleteDepartment(departmentId);
  }
}
