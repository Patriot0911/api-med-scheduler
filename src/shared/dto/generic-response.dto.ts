import { ApiProperty } from "@nestjs/swagger";
import { IGenericDataResponse } from "../models/generic-data.response";

export class GenericResponseDto<T> implements IGenericDataResponse<T> {
  @ApiProperty({})
  data: T;

  @ApiProperty({ type: 'boolean' })
  status: true;
}
