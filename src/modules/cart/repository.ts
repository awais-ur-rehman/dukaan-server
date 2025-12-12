import { Cart, type ICart } from '../../models/Cart';
import { Product } from '../../models/Product';
import mongoose from 'mongoose';

export class CartRepository {
  async findByCustomerAndMerchant(customerId: string, merchantId: string): Promise<ICart | null> {
    return Cart.findOne({
      customerId: new mongoose.Types.ObjectId(customerId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    }).exec();
  }

  async create(data: Partial<ICart>): Promise<ICart> {
    const cart = new Cart(data);
    return cart.save();
  }

  async update(cartId: string, data: Partial<ICart>): Promise<ICart | null> {
    return Cart.findByIdAndUpdate(cartId, data, { new: true })
      .populate('items.productId', 'names price stock unit images')
      .exec();
  }

  async findByCustomerId(customerId: string): Promise<ICart[]> {
    return Cart.find({ customerId: new mongoose.Types.ObjectId(customerId) })
      .populate('merchantId', 'names deliveryCharge')
      .populate('items.productId', 'names price stock unit images')
      .exec();
  }

  async delete(cartId: string): Promise<boolean> {
    const result = await Cart.findByIdAndDelete(cartId).exec();
    return !!result;
  }

  async clearByCustomerAndMerchant(customerId: string, merchantId: string): Promise<boolean> {
    const result = await Cart.findOneAndDelete({
      customerId: new mongoose.Types.ObjectId(customerId),
      merchantId: new mongoose.Types.ObjectId(merchantId),
    }).exec();
    return !!result;
  }
}

