import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IEditLessonModel } from '../../models/lessons/edit-lesson.model';

export class EditLessonRequestDto implements IEditLessonModel {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '2026-02-01T10:00:00Z',
    description: 'ISO 8601 date string',
  })
  @Type(() => Date)
  @IsDate()
  date: Date;

  @Min(5)
  @IsNumber()
  @ApiProperty({ example: 50, description: 'lesson`s duration in minutes' })
  duration: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
