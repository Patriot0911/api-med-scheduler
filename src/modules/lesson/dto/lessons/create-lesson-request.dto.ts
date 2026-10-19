import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ICreateLessonModel } from '../../models/lessons/create-lesson.model';
import { IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LessonVisibility } from '../../models/lesson-visibility.enum';

export class CreateLessonRequestDto implements ICreateLessonModel {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsUUID()
  semesterId: string;

  @ApiProperty()
  @IsUUID()
  @IsOptional()
  lessonGroupId?: string;

  @ApiProperty({
    example: '2026-31-01T10:00:00Z',
    description: 'ISO 8601 date string',
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({
    required: false,
    example: '2026-31-01T10:00:00Z',
    description: 'ISO 8601 date string',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  delayedDate?: Date;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Department of the lesson, optional. Non-admins may set only their own department.',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;

  @ApiPropertyOptional({
    description: 'Owner teacher profile id. Defaults to the acting teacher; only admin / manage_lessons may set someone else.',
  })
  @IsOptional()
  @IsUUID()
  ownerTeacherId?: string;

  @ApiProperty({ description: 'Teacher profile ids (TeacherEntity.id, not user id), from any department. The owner is added automatically.' })
  @IsArray()
  @IsString({ each: true })
  teacherIds: string[];

  @ApiPropertyOptional({ description: 'Co-teachers allowed to edit the lesson, a subset of teacherIds. Set by the owner or admin / manage_lessons.' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  editorTeacherIds?: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  studentGroupIds: string[];

  @Min(5)
  @IsNumber()
  @ApiProperty({ example: 50, description: 'lesson`s duration in minutes' })
  duration: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    enum: LessonVisibility,
    default: LessonVisibility.AUTHENTICATED,
    description: 'public — visible to everyone, including the public calendar; authenticated — visible to any signed-in user (default); department — only members of the lesson\'s department, the lesson teachers and admin / manage_lessons, 404 for anyone else (requires departmentId)',
  })
  @IsOptional()
  @IsEnum(LessonVisibility)
  visibility?: LessonVisibility;
}
