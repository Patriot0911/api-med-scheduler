import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { RolesService } from "src/modules/roles/services/roles.service";
import { Permission } from "src/shared/models/permission.enum";
import { DictionariesService } from "../services/dictionaries.service";
import { GroupTagsService } from 'src/modules/student-groups/services/group-tags.service';
import { IRoleDictionaryItemModel } from 'src/modules/roles/models/role-dictionary-item.model';
import { ITagDictionaryItem } from 'src/modules/student-groups/models/tag-dictionary-item.model';
import { SemestersService } from 'src/modules/semester/services/semesters.service';
import { ISemesterDictionaryItem } from 'src/modules/semester/models/semester-dictionary-item.model';
import { StudentGroupsService } from 'src/modules/student-groups/services/student-groups.service';
import { IGroupDictionaryItem } from 'src/modules/student-groups/models/group-dictionary-item.model';
import { LessonsGroupsService } from 'src/modules/lesson/services/lessons-groups.service';
import { ILessonGroupDictionaryItem } from 'src/modules/lesson/models/lesson-groups/lesson-group-dictionary-item.model';

@ApiTags('Dictionaries')
@Controller('api/dictionaries')
export class DictionariesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly dictionariesService: DictionariesService,
    private readonly groupTagsService: GroupTagsService,
    private readonly semestersService: SemestersService,
    private readonly studentGroupsService: StudentGroupsService,
    private readonly lessonsGroupsService: LessonsGroupsService,
  ) {}

  @Get('permissions')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_ROLES, Permission.ADMIN)
  getPermissionsDictionary(): Permission[] {
    return this.dictionariesService.getPermissions();
  }

  @Get('roles')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.READ_ROLES, Permission.ADMIN)
  async getRolesDictionary(): Promise<IRoleDictionaryItemModel[]> {
    return await this.rolesService.getRolesDictionary();
  }

  @Get('group-tags')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getGroupTagsDictionary(): Promise<ITagDictionaryItem[]> {
    return await this.groupTagsService.getTagsDictionary();
  }

  @Get('group')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getGroupDictionary(): Promise<IGroupDictionaryItem[]> {
    return await this.studentGroupsService.getGroupsDictionary();
  }

  @Get('semesters')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getSemestersDictionary(): Promise<ISemesterDictionaryItem[]> {
    return await this.semestersService.getSemesterDictionary();
  }

  @Get('lesson-groups')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  async getLessonGroupsDictionary(): Promise<ILessonGroupDictionaryItem[]> {
    return await this.lessonsGroupsService.getLessonGroupsDictionary();
  }
}
