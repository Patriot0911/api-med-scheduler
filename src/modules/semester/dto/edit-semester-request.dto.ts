import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsString, MinLength } from "class-validator";
import { ICreateSemesterModel } from "../models/create-semester.model";
import { Type } from 'class-transformer';

export class EditSemesterRequestDto implements ICreateSemesterModel {
  @ApiProperty({ example: 'Перший навчальний семестр 2025-2026' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: Date(), })
  @Type(() => Date)
  @IsDate()
  dateFrom: Date;

  @ApiProperty({ example: Date(), })
  @Type(() => Date)
  @IsDate()
  dateTo: Date;
}
