import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsPostalCode,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  customerName!: string;

  @IsNotEmpty()
  @IsEmail()
  cemail!: string;

  @IsNotEmpty()
  @IsPhoneNumber() // You can specify a region code if needed
  phone!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  address!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  city!: string;

  @IsNotEmpty()
  @IsPostalCode('any') // You can specify a locale if needed
  postalCode!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  country!: string;
}
