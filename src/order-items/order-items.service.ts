import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderItem, OrderItemDocument } from './schemas/order-item.schema';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectModel(OrderItem.name)
    private orderItemModel: Model<OrderItemDocument>,
    private readonly ordersService: OrdersService,
  ) {}

  async create(createOrderItemDto: CreateOrderItemDto): Promise<OrderItem> {
    await this.ordersService.findOne(createOrderItemDto.orderId);
    const item = await this.orderItemModel.create(createOrderItemDto);
    await this.recalculateOrderTotal(createOrderItemDto.orderId);
    return item;
  }

  findAll(): Promise<OrderItem[]> {
    return this.orderItemModel.find().exec();
  }

  findAllByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderItemModel.find({ orderId }).exec();
  }

  async findOne(id: string): Promise<OrderItem> {
    const item = await this.orderItemModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException(`Order item ${id} not found`);
    }
    return item;
  }

  async update(
    id: string,
    updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    const existing = await this.orderItemModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Order item ${id} not found`);
    }
    const previousOrderId = existing.orderId;

    if (updateOrderItemDto.orderId) {
      await this.ordersService.findOne(updateOrderItemDto.orderId);
    }

    const item = await this.orderItemModel
      .findByIdAndUpdate(id, updateOrderItemDto, { new: true })
      .exec();
    if (!item) {
      throw new NotFoundException(`Order item ${id} not found`);
    }

    await this.recalculateOrderTotal(item.orderId);
    if (
      updateOrderItemDto.orderId &&
      updateOrderItemDto.orderId !== previousOrderId
    ) {
      await this.recalculateOrderTotal(previousOrderId);
    }

    return item;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderItemModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Order item ${id} not found`);
    }
    await this.recalculateOrderTotal(result.orderId);
  }

  private async recalculateOrderTotal(orderId: string): Promise<void> {
    const items = await this.orderItemModel.find({ orderId }).exec();
    const totalPrice = items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );
    await this.ordersService.update(orderId, { totalPrice });
  }
}
