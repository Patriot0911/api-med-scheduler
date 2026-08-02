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

  @ApiProperty({ description: 'Teacher profile ids (TeacherEntity.id, not user id)' })
  @IsArray()
  @IsString({ each: true })
  teacherIds: string[];

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
    default: LessonVisibility.RESTRICTED,
    description: 'public — visible to any authenticated user; teachers — visible to any teacher; restricted — visible only to the assigned teachers/groups (default)',
  })
  @IsOptional()
  @IsEnum(LessonVisibility)
  visibility?: LessonVisibility;
}
