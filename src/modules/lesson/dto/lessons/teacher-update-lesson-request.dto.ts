import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ITeacherUpdateLessonModel } from '../../models/lessons/teacher-update-lesson.model';

export class TeacherUpdateLessonRequestDto implements ITeacherUpdateLessonModel {
  @ApiProperty({ required: false, description: 'Teacher`s note for the lesson' })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    required: false,
    example: '2026-02-14T10:00:00Z',
    description: 'New date/time to reschedule the lesson to (ISO 8601 date string)',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  delayedDate?: Date;
}
