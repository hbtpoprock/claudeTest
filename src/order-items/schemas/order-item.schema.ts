import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type OrderItemDocument = HydratedDocument<OrderItem>;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
