import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { StudentGroupsService } from "../services/student-groups.service";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { Permission } from "src/shared/models/permission.enum";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { IGenericListPayloadResponse } from "src/shared/models/generic-list-payload.response";
import { GetStudentGroupsRequestDto } from "../dto/get-student-groups-request.dto";
import { IStudentGroupListItemModel } from "../models/student-group-list-item.model";
import { IStudentGroupItemModel } from "../models/student-group-item.model";
import { CreateStudentGroupRequestDto } from "../dto/create-student-group-request.dto";
import { EditStudentGroupRequestDto } from "../dto/edit-student-group-request.dto";

@ApiTags('Student Groups')
@Controller('api/student-groups')
export class StudentGroupsController {
  constructor(
    private readonly studentGroupsService: StudentGroupsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_GROUPS)
  async getAllStudentGroups(@Query() params: GetStudentGroupsRequestDto): Promise<IGenericListPayloadResponse<IStudentGroupListItemModel>> {
    return await this.studentGroupsService.getAll(params);
  }

  @Get(':studentGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_GROUPS)
  async getStudentGroup(@Param('studentGroupId') studentGroupId: string): Promise<IStudentGroupItemModel> {
    return await this.studentGroupsService.getById(studentGroupId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_GROUPS)
  async createStudentGroup(@Body() data: CreateStudentGroupRequestDto): Promise<IStudentGroupItemModel> {
    return await this.studentGroupsService.createGroup(data);
  }

  @Put(':studentGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_GROUPS)
  async editRole(
    @Param('studentGroupId') studentGroupId: string,
    @Body() data: EditStudentGroupRequestDto,
  ): Promise<boolean> {
    return await this.studentGroupsService.editStudentGroup(data, studentGroupId);
  }

  @Delete(':studentGroupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_GROUPS)
  async deleteStudentGroup(@Param('studentGroupId') studentGroupId: string): Promise<IStudentGroupItemModel> {
    return await this.studentGroupsService.deleteGroup(studentGroupId);
  }
}
