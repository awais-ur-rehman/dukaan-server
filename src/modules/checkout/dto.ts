import { z } from 'zod';

export const checkoutDto = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  addressId: z.string().min(1, 'Address ID is required'),
  paymentMethod: z.enum(['COD', 'DROP_AT_DOOR', 'DOOR_WALLET']),
  deliverySlot: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    window: z.string().min(1),
  }),
  note: z.string().optional(),
});

export type CheckoutRequest = z.infer<typeof checkoutDto>;

