import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { toArray } from 'src/shared/transforms/to-array.transform';
import { toBoolean } from 'src/shared/transforms/to-boolean.transform';
import { ILessonsFiltersModel } from '../../models/lessons/lessons-filters.model';
import { LessonVisibility } from '../../models/lesson-visibility.enum';

export class LessonsFiltersRequestDto implements ILessonsFiltersModel {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: 'string', description: 'Lesson name or note, course name, teacher name, student group name' })
  search?: string;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID('all', { each: true, })
  @ApiPropertyOptional({ type: [String], description: 'Lessons taught by any of these teachers (ids from /dictionaries/teachers)' })
  teacherIds?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID('all', { each: true, })
  @ApiPropertyOptional({ type: [String], description: 'Lessons of any of these student groups (ids from /dictionaries/group)' })
  studentGroupIds?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID('all', { each: true, })
  @ApiPropertyOptional({ type: [String], description: 'Lessons of student groups having any of these tags' })
  groupTagIds?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID('all', { each: true, })
  @ApiPropertyOptional({ type: [String], description: 'Lessons of any of these departments' })
  departmentIds?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID('all', { each: true, })
  @ApiPropertyOptional({ type: [String], description: 'Lessons of any of these courses (ids from /dictionaries/lesson-groups)' })
  lessonGroupIds?: string[];

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  @ApiPropertyOptional({ type: Boolean, description: 'Only lessons outside of any lesson group' })
  withoutLessonGroup?: boolean;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID('all', { each: true, })
  @ApiPropertyOptional({ type: [String], description: 'Lessons of any of these semesters' })
  semesterIds?: string[];

  @IsOptional()
  @IsEnum(LessonVisibility)
  @ApiPropertyOptional({
    enum: LessonVisibility,
    description: 'Only lessons with this visibility, among the ones the user may see (anonymous users see public lessons only)',
  })
  visibility?: LessonVisibility;
}
