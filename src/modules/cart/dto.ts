import { z } from 'zod';

export const addToCartDto = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  qty: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const updateCartItemDto = z.object({
  qty: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const removeFromCartDto = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

export type AddToCartRequest = z.infer<typeof addToCartDto>;
export type UpdateCartItemRequest = z.infer<typeof updateCartItemDto>;
export type RemoveFromCartRequest = z.infer<typeof removeFromCartDto>;

