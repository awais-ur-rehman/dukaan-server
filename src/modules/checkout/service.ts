import { CartRepository } from '../cart/repository';
import { AddressRepository } from '../addresses/repository';
import { OrderService } from '../orders/service';
import { MerchantRepository } from '../merchants/repository';
import { CustomerRepository } from '../customers/repository';
import { type CheckoutRequest } from './dto';
import { AppError } from '../../middleware/errorHandler';

export class CheckoutService {
  private cartRepository: CartRepository;
  private addressRepository: AddressRepository;
  private orderService: OrderService;
  private merchantRepository: MerchantRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.cartRepository = new CartRepository();
    this.addressRepository = new AddressRepository();
    this.orderService = new OrderService();
    this.merchantRepository = new MerchantRepository();
    this.customerRepository = new CustomerRepository();
  }

  async checkout(customerId: string, data: CheckoutRequest) {
    const cart = await this.cartRepository.findByCustomerAndMerchant(customerId, data.merchantId);
    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400, 'EMPTY_CART');
    }

    const address = await this.addressRepository.findById(data.addressId);
    if (!address || address.customerId.toString() !== customerId) {
      throw new AppError('Address not found', 404, 'ADDRESS_NOT_FOUND');
    }

    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }

    const merchant = await this.merchantRepository.findById(data.merchantId);
    if (!merchant || !merchant.isApproved) {
      throw new AppError('Merchant not found or not approved', 404, 'MERCHANT_NOT_FOUND');
    }

    const orderData = {
      merchantId: data.merchantId,
      customerId,
      customerSnapshot: {
        name: customer.name || 'Customer',
        phone: address.phone || customer.phone || '',
        addressText: address.addressText,
        geo: {
          lat: address.geo.coordinates[1],
          lng: address.geo.coordinates[0],
        },
        note: data.note,
      },
      items: cart.items.map((item) => ({
        productId: item.productId.toString(),
        qty: item.qty,
      })),
      paymentMethod: data.paymentMethod,
      deliverySlot: data.deliverySlot,
    };

    const order = await this.orderService.create(orderData, customerId);

    await this.cartRepository.clearByCustomerAndMerchant(customerId, data.merchantId);

    return order;
  }
}

