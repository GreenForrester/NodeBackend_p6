import { Type, Transform } from 'class-transformer';
import {
  IsUUID,
  IsDate,
  ValidateIf,
  IsString,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { OrderItemDto } from './order-item.dto';
export class CreateOrderDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsUUID('4')
  customerId!: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Type(() => Date)
  @IsDate()
  shippingDate?: Date;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(2000)
  comments?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems!: OrderItemDto[];
}
