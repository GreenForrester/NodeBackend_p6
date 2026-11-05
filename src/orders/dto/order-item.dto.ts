import { Transform } from 'class-transformer';
import { IsInt, IsUUID, Min, Max } from 'class-validator';
export class OrderItemDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsUUID('4')
  productId!: string;
  @IsInt() @Min(1) @Max(100000) quantity!: number;
}
