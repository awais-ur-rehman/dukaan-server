import { z } from 'zod';

const multilingualTextSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  ur: z.string().optional(),
});

const imageSchema = z.object({
  url: z.string().url('Invalid URL'),
  publicId: z.string().min(1, 'Public ID is required'),
});

export const createProductDto = z.object({
  merchantId: z.string().min(1, 'Merchant ID is required'),
  sku: z.string().optional(),
  names: multilingualTextSchema,
  description: multilingualTextSchema.optional(),
  images: z.array(imageSchema).min(1, 'At least one image is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  stock: z.number().int().min(0, 'Stock must be non-negative integer'),
  unit: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional().default(true),
});

export const updateProductDto = createProductDto.partial().omit({ merchantId: true });

export const getProductsQueryDto = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  inStock: z.string().optional().transform((val) => val === 'true'),
});

export type CreateProductRequest = z.infer<typeof createProductDto>;
export type UpdateProductRequest = z.infer<typeof updateProductDto>;
export type GetProductsQuery = z.infer<typeof getProductsQueryDto>;

