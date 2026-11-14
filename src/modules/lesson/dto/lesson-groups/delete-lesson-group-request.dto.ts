import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { toBoolean } from 'src/shared/transforms/to-boolean.transform';

export class DeleteLessonGroupRequestDto {
  @ApiPropertyOptional({ type: Boolean, default: false, description: 'Delete the lessons of the group too; otherwise they stay without a group' })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  withLessons?: boolean;
}
