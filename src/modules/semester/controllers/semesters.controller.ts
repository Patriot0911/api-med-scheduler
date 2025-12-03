import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAccessGuard } from "src/modules/auth/guards/access-refresh.guard";
import { PermissionsGuard } from "src/modules/auth/guards/permission.guard";
import { Permissions } from "src/modules/auth/decorator/roles.decorator";
import { Permission } from "../../../shared/models/permission.enum";
import { SemestersService } from "../services/semesters.service";
import { CreateSemesterRequestDto } from "../dto/create-semester-request.dto";
import { GetSemestersRequestDto } from "../dto/get-semesters-request.dto";
import { IGenericListPayloadResponse, } from "src/shared/models/generic-list-payload.response";
import { ISemesterItemModel } from "../models/semester-item.model";
import { ISemesterListItemModel } from "../models/semester-list-item.model";

@ApiTags('Semesters')
@Controller('api/semesters')
export class SemestersController {
  constructor(
    private readonly semestersService: SemestersService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async getAllSemesters(@Query() params: GetSemestersRequestDto): Promise<IGenericListPayloadResponse<ISemesterListItemModel>> {
    return await this.semestersService.getAll(params);
  }

  @Get(':semesterId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async getSemester(@Param('semesterId') semesterId: string): Promise<ISemesterItemModel> {
    return await this.semestersService.getById(semesterId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async createSemester(@Body() data: CreateSemesterRequestDto): Promise<ISemesterItemModel> {
    return await this.semestersService.createSemester(data);
  }

  @Put(':semesterId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async editSemester(@Param('semesterId') semesterId: string, @Body() data: CreateSemesterRequestDto,): Promise<boolean> {
    return await this.semestersService.editSemester(data, semesterId);
  }

  @Delete(':semesterId')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, PermissionsGuard)
  @Permissions(Permission.ADMIN)
  async deleteSemester(@Param('semesterId') semesterId: string,): Promise<ISemesterItemModel> {
    return await this.semestersService.deleteSemester(semesterId);
  }
}
