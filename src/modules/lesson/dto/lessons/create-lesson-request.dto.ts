import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ICreateLessonModel } from '../../models/lessons/create-lesson.model';
import { ArrayMinSize, IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { LessonVisibility } from '../../models/lesson-visibility.enum';

export class CreateLessonRequestDto implements ICreateLessonModel {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ nullable: true, })
  @IsOptional()
  @IsUUID()
  semesterId?: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Optional lesson group (a series, lessons that belong together); null takes the lesson out of its group' })
  @IsOptional()
  @IsUUID()
  lessonGroupId?: string | null;

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
    type: [String],
    description: 'Departments of the lesson; the head of each may edit it. A teacher may add only departments of the lesson teachers.',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true, })
  departmentIds?: string[];


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
