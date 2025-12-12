import { CartRepository } from './repository';
import { ProductRepository } from '../products/repository';
import { MerchantRepository } from '../merchants/repository';
import { type AddToCartRequest, type UpdateCartItemRequest, type RemoveFromCartRequest } from './dto';
import { AppError } from '../../middleware/errorHandler';
import { type ICart } from '../../models/Cart';

export class CartService {
  private cartRepository: CartRepository;
  private productRepository: ProductRepository;
  private merchantRepository: MerchantRepository;

  constructor() {
    this.cartRepository = new CartRepository();
    this.productRepository = new ProductRepository();
    this.merchantRepository = new MerchantRepository();
  }

  async addToCart(customerId: string, data: AddToCartRequest) {
    const product = await this.productRepository.findById(data.productId);
    if (!product || !product.active) {
      throw new AppError('Product not found or inactive', 404, 'PRODUCT_NOT_FOUND');
    }

    if (product.stock < data.qty) {
      throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }

    if (product.merchantId.toString() !== data.merchantId) {
      throw new AppError('Product does not belong to this merchant', 400, 'INVALID_MERCHANT');
    }

    let cart = await this.cartRepository.findByCustomerAndMerchant(customerId, data.merchantId);

    if (!cart) {
      const merchant = await this.merchantRepository.findById(data.merchantId);
      if (!merchant || !merchant.isApproved) {
        throw new AppError('Merchant not found or not approved', 404, 'MERCHANT_NOT_FOUND');
      }

      cart = await this.cartRepository.create({
        customerId,
        merchantId: data.merchantId,
        items: [],
        subtotal: 0,
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === data.productId
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].qty += data.qty;
    } else {
      cart.items.push({
        productId: product._id,
        name: product.names.en,
        price: product.price,
        qty: data.qty,
        unit: product.unit,
        imageUrl: product.images[0]?.url,
      });
    }

    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const updated = await this.cartRepository.update(cart._id.toString(), cart);
    if (!updated) {
      throw new AppError('Failed to update cart', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  async getCart(customerId: string, merchantId?: string) {
    if (merchantId) {
      const cart = await this.cartRepository.findByCustomerAndMerchant(customerId, merchantId);
      return cart ? this.toResponse(cart) : null;
    }

    const carts = await this.cartRepository.findByCustomerId(customerId);
    return carts.map((c) => this.toResponse(c));
  }

  async updateCartItem(customerId: string, merchantId: string, productId: string, data: UpdateCartItemRequest) {
    const cart = await this.cartRepository.findByCustomerAndMerchant(customerId, merchantId);
    if (!cart) {
      throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');
    }

    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);
    if (itemIndex < 0) {
      throw new AppError('Item not found in cart', 404, 'ITEM_NOT_FOUND');
    }

    const product = await this.productRepository.findById(productId);
    if (!product || product.stock < data.qty) {
      throw new AppError('Insufficient stock', 400, 'INSUFFICIENT_STOCK');
    }

    cart.items[itemIndex].qty = data.qty;
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const updated = await this.cartRepository.update(cart._id.toString(), cart);
    if (!updated) {
      throw new AppError('Failed to update cart', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  async removeFromCart(customerId: string, merchantId: string, productId: string) {
    const cart = await this.cartRepository.findByCustomerAndMerchant(customerId, merchantId);
    if (!cart) {
      throw new AppError('Cart not found', 404, 'CART_NOT_FOUND');
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId);
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.qty, 0);

    if (cart.items.length === 0) {
      await this.cartRepository.delete(cart._id.toString());
      return null;
    }

    const updated = await this.cartRepository.update(cart._id.toString(), cart);
    if (!updated) {
      throw new AppError('Failed to update cart', 500, 'UPDATE_FAILED');
    }

    return this.toResponse(updated);
  }

  async clearCart(customerId: string, merchantId: string) {
    await this.cartRepository.clearByCustomerAndMerchant(customerId, merchantId);
  }

  private toResponse(cart: ICart) {
    const merchant = (cart.merchantId as any)?.toObject?.() || cart.merchantId;
    return {
      _id: cart._id.toString(),
      merchantId: cart.merchantId.toString(),
      merchantName: merchant?.names?.en || 'Unknown',
      items: cart.items.map((item) => ({
        productId: item.productId.toString(),
        name: item.name,
        price: item.price,
        qty: item.qty,
        unit: item.unit,
        imageUrl: item.imageUrl,
        subtotal: item.price * item.qty,
      })),
      subtotal: cart.subtotal,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}

