import { Type } from 'class-transformer';
import {
  IsDate,
  ValidateIf,
  IsString,
  MaxLength,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsIn,
  IsBoolean,
} from 'class-validator';
import { OrderItemDto } from './order-item.dto';
export class UpdateOrderDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Type(() => Date)
  @IsDate()
  shippingDate?: Date;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(2000)
  comments?: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(['pending', 'shipped', 'cancelled'])
  status?: 'pending' | 'shipped' | 'cancelled';
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  paid?: boolean;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  orderItems?: OrderItemDto[];
}
