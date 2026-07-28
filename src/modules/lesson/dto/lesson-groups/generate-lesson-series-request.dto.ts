import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsDate, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IGenerateLessonSeriesModel } from '../../models/lesson-groups/generate-lesson-series.model';

export class GenerateLessonSeriesRequestDto implements IGenerateLessonSeriesModel {
  @ApiProperty({ description: 'ID of the existing lesson to use as a template for the series' })
  @IsUUID()
  baseLessonId: string;

  @ApiPropertyOptional({ description: 'Interval in days between generated lessons (used together with repeatCount)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  intervalDays?: number;

  @ApiPropertyOptional({ description: 'How many new lessons to generate after the base lesson, spaced by intervalDays' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  repeatCount?: number;

  @ApiPropertyOptional({
    example: ['2026-02-07T10:00:00Z', '2026-02-14T10:00:00Z'],
    description: 'Explicit list of dates/times to generate new lessons at, instead of intervalDays/repeatCount',
    type: [Date],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @Type(() => Date)
  @IsDate({ each: true })
  dates?: Date[];
}
