import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { Permission } from "src/shared/models/permission.enum";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { IGenericListPayloadResponse } from "src/shared/models/generic-list-payload.response";
import { GroupTagsService } from '../services/group-tags.service';
import { GetTagsRequestDto } from '../dto/get-tags-request.dto';
import { ITagItemModel } from '../models/tag-item.model';
import { ITagListItemModel } from '../models/tag-list-item.model';
import { CreateTagRequestDto } from '../dto/create-tag-request.dto';
import { EditTagRequestDto } from '../dto/edit-tag-request.dto';
import { ITagStudentGroupItemModel } from '../models/tags-student-group-item.model';
import { EditTagGroupsRequestDto } from '../dto/edit-tag-groups-request.dto';

@ApiTags('Group Tags')
@Controller('api/group-tags')
export class GroupTagsController {
  constructor(
    private readonly groupTagsService: GroupTagsService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_GROUPS, Permission.ADMIN)
  async getAllTags(@Query() params: GetTagsRequestDto): Promise<IGenericListPayloadResponse<ITagListItemModel>> {
    return await this.groupTagsService.getAll(params);
  }

  @Get(':tagId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_GROUPS, Permission.ADMIN)
  async getTag(@Param('tagId') tagId: string): Promise<ITagItemModel> {
    return await this.groupTagsService.getById(tagId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.EDIT_GROUPS, Permission.ADMIN)
  async createTag(@Body() data: CreateTagRequestDto): Promise<ITagItemModel> {
    return await this.groupTagsService.createTag(data);
  }

  @Put(':tagId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.EDIT_GROUPS, Permission.ADMIN)
  async editTag(
    @Param('tagId') tagId: string,
    @Body() data: EditTagRequestDto,
  ): Promise<boolean> {
    return await this.groupTagsService.editTag(data, tagId);
  }

  @Delete(':tagId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.EDIT_GROUPS, Permission.ADMIN)
  async deleteTag(@Param('tagId') tagId: string): Promise<ITagItemModel> {
    return await this.groupTagsService.deleteTag(tagId);
  }

  @Get(':tagId/groups')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.EDIT_GROUPS, Permission.ADMIN)
  async getTagGroups(@Param('tagId') tagId: string): Promise<ITagStudentGroupItemModel[]> {
    return await this.groupTagsService.getTagGroupsById(tagId);
  }

  @Put(':tagId/groups')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.EDIT_GROUPS, Permission.ADMIN)
  async editTagGroups(@Param('tagId') tagId: string, @Body() data: EditTagGroupsRequestDto): Promise<boolean> {
    return await this.groupTagsService.editTagGroups(tagId, data);
  }

  @Post(':tagId/groups')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.EDIT_GROUPS, Permission.ADMIN)
  async addTagGroups(@Param('tagId') tagId: string, @Body() data: EditTagGroupsRequestDto): Promise<boolean> {
    return await this.groupTagsService.addTagGroups(tagId, data);
  }

  @Delete(':tagId/groups/:groupId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.EDIT_GROUPS, Permission.ADMIN)
  async deleteGroupFromTag(
    @Param('tagId') tagId: string,
    @Param('groupId') groupId: string,
  ): Promise<boolean> {
    return await this.groupTagsService.deleteGroupFromTag(tagId, groupId);
  }
}
