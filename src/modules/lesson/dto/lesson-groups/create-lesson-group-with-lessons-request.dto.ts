import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ICreateLessonGroupWithLessonsModel } from '../../models/lesson-groups/create-lesson-group-with-lessons.model';
import { LessonVisibility } from '../../models/lesson-visibility.enum';

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

  @ApiPropertyOptional({
    nullable: true,
    description: 'Department of the group and its lessons, optional. Non-admins may set only their own department.',
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

  @ApiPropertyOptional({ description: 'Co-teachers allowed to edit the lessons, a subset of teacherIds' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  editorTeacherIds?: string[];

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

  @ApiPropertyOptional({
    enum: LessonVisibility,
    default: LessonVisibility.AUTHENTICATED,
    description: 'public — visible to everyone, including the public calendar; authenticated — visible to any signed-in user (default); department — only members of the lesson\'s department, the lesson teachers and admin / manage_lessons, 404 for anyone else (requires a department)',
  })
  @IsOptional()
  @IsEnum(LessonVisibility)
  visibility?: LessonVisibility;
}
