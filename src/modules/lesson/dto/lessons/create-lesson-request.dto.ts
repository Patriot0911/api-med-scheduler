import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ICreateLessonModel } from '../../models/lessons/create-lesson.model';
import { ArrayMinSize, IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
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
    description: 'Department of the lesson, optional. Its head may edit the lesson. A teacher may set only their own department.',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string | null;


  @ApiProperty({ description: 'Teacher profile ids (TeacherEntity.id, not user id), from any department. Every one of them may edit the lesson.' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true, })
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
    default: LessonVisibility.ALL,
    description: 'all — anyone, anonymous visitors of the public schedule included (default); involved — only the lesson teachers, the head of the lesson\'s department and students of its groups, 404 for anyone else',
  })
  @IsOptional()
  @IsEnum(LessonVisibility)
  visibility?: LessonVisibility;
}
