import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { GenericResponseDto } from '../dto/generic-response.dto';

export const ApiGenericResponses = <TModel extends Type<any>>(
  responses: {[status in number]: TModel;},
) => {
  const models = Object.values(responses);

  return applyDecorators(
    ApiExtraModels(GenericResponseDto, ...models),
    ...Object.entries(responses).map(([status, state]) =>
      ApiResponse({
        status: Number(status),
        schema: {
          allOf: [
            { $ref: getSchemaPath(GenericResponseDto) },
            {
              properties: {
                data: { $ref: getSchemaPath(state) },
              },
            },
          ],
        },
      }),
    ),
  );
};
