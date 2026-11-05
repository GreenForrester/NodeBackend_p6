import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';
export class PaginationDto {
  @Type(() => Number) @IsInt() @Min(0) @Max(100000) offset = 0;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
}
