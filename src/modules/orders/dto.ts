import { z } from 'zod';

export const createOrderDto = z.object({
  clientOrderId: z.string().optional(),
  merchantId: z.string().min(1, 'Merchant ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  customerSnapshot: z.object({
    name: z.string().min(1),
    phone: z.string().min(1),
    addressText: z.string().min(1),
    geo: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    note: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().min(1),
      })
    )
    .min(1, 'At least one item is required'),
  paymentMethod: z.enum(['COD', 'DROP_AT_DOOR', 'DOOR_WALLET']),
  deliverySlot: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
    window: z.string().min(1),
  }),
});

export const merchantAcceptDto = z.object({
  accepted: z.boolean(),
  unavailableItems: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const customerConfirmDto = z.object({
  confirmed: z.boolean(),
});

export const assignRiderDto = z.object({
  riderId: z.string().min(1, 'Rider ID is required'),
});

export const riderUpdateDto = z.object({
  status: z.enum(['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED']),
  podImageUrl: z.string().url().optional(),
  otpProvided: z.string().optional(),
  note: z.string().optional(),
});

export const getOrdersQueryDto = z.object({
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export type CreateOrderRequest = z.infer<typeof createOrderDto>;
export type MerchantAcceptRequest = z.infer<typeof merchantAcceptDto>;
export type CustomerConfirmRequest = z.infer<typeof customerConfirmDto>;
export type AssignRiderRequest = z.infer<typeof assignRiderDto>;
export type RiderUpdateRequest = z.infer<typeof riderUpdateDto>;
export type GetOrdersQuery = z.infer<typeof getOrdersQueryDto>;

