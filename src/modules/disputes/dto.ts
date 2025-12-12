import { z } from 'zod';

export const createDisputeDto = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  type: z.enum(['ORDER_QUALITY', 'MISSING_ITEMS', 'WRONG_ITEMS', 'PAYMENT_ISSUE', 'DELIVERY_ISSUE', 'OTHER']),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const addCommentDto = z.object({
  message: z.string().min(1, 'Message is required'),
});

export type CreateDisputeRequest = z.infer<typeof createDisputeDto>;
export type AddCommentRequest = z.infer<typeof addCommentDto>;

