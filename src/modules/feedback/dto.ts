import { z } from 'zod';

export const createFeedbackDto = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export type CreateFeedbackRequest = z.infer<typeof createFeedbackDto>;

