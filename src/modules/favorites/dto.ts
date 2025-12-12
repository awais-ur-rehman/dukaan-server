import { z } from 'zod';

export const addFavoriteDto = z.object({
  type: z.enum(['shop', 'product']),
  shopId: z.string().optional(),
  productId: z.string().optional(),
});

export type AddFavoriteRequest = z.infer<typeof addFavoriteDto>;

