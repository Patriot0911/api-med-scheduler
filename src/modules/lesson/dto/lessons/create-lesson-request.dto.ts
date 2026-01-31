import { ApiProperty } from '@nestjs/swagger';
import { ICreateLessonModel } from '../../models/lessons/create-lesson.model';
import { IsArray, IsDate, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiProperty()
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
}
