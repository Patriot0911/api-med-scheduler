import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsDate, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ICreateLessonGroupWithLessonsModel } from '../../models/lesson-groups/create-lesson-group-with-lessons.model';

export class CreateLessonGroupWithLessonsRequestDto implements ICreateLessonGroupWithLessonsModel {
  @ApiProperty({ example: 'Анатомія, лекція' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    example: '2026-02-07T10:00:00Z',
    description: 'Date of the first lesson in the series (ISO 8601 date string)',
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty()
  @IsUUID()
  semesterId: string;

  @Min(5)
  @IsNumber()
  @ApiProperty({ example: 50, description: 'lesson`s duration in minutes' })
  duration: number;

  @ApiProperty({ description: 'Teacher profile ids (TeacherEntity.id, not user id)' })
  @IsArray()
  @IsString({ each: true })
  teacherIds: string[];

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  studentGroupIds: string[];

  @ApiPropertyOptional({ description: 'Interval in days between generated lessons (used together with repeatCount)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalDays?: number;

  @ApiPropertyOptional({ description: 'Total number of lessons to generate, including the first one at `date`' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  repeatCount?: number;

  @ApiPropertyOptional({
    example: ['2026-02-07T10:00:00Z', '2026-02-14T10:00:00Z'],
    description: 'Explicit list of dates/times to generate lessons at, instead of `date` + intervalDays/repeatCount',
    type: [Date],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @Type(() => Date)
  @IsDate({ each: true })
  dates?: Date[];
}
