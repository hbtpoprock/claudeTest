import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = HydratedDocument<User>;

const SALT_ROUNDS = 10;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (this: UserDocument) {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

UserSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as { password?: string };
  if (update?.password) {
    update.password = await bcrypt.hash(update.password, SALT_ROUNDS);
  }
});
