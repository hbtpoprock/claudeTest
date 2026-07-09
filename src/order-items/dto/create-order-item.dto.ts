import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsMongoId()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}
