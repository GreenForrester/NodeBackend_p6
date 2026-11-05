import {
  IsNotEmpty,
  IsInt,
  Max,
  MaxLength,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  productName!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  productvendor!: string;

  @IsString()
  @MaxLength(2000)
  productDescription!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(100000000)
  quantityInStock!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(100000000)
  buyPrice!: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(100000000)
  msrp!: number;
}
