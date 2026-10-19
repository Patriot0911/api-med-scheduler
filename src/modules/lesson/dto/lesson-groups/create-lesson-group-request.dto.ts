import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ICreateLessonGroupModel } from '../../models/lesson-groups/create-lesson-group.model';
import { EditLessonGroupRequestDto } from './edit-lesson-group-request.dto';

export class CreateLessonGroupRequestDto extends EditLessonGroupRequestDto implements ICreateLessonGroupModel {
  @ApiPropertyOptional({ nullable: true, description: 'Department of the group, optional. Non-admins may set only their own department.' })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;
}
