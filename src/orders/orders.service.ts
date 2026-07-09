import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly usersService: UsersService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    await this.usersService.findOne(createOrderDto.userId);
    return this.orderModel.create(createOrderDto);
  }

  findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  findAllByUserId(userId: string): Promise<Order[]> {
    return this.orderModel.find({ userId }).exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    if (updateOrderDto.userId) {
      await this.usersService.findOne(updateOrderDto.userId);
    }
    const order = await this.orderModel
      .findByIdAndUpdate(id, updateOrderDto, { new: true })
      .exec();
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    return order;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Order ${id} not found`);
    }
  }
}
