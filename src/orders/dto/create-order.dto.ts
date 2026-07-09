import { IsMongoId, IsNumber, Min } from 'class-validator';

export class CreateOrderDto {
  @IsMongoId()
  userId: string;

  @IsNumber()
  @Min(0)
  totalPrice: number;
}
