import { z } from 'zod';

export const searchProductsDto = z.object({
  q: z.string().min(1, 'Search query is required'),
  lat: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  lng: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  radius: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  category: z.string().optional(),
  minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export type SearchProductsRequest = z.infer<typeof searchProductsDto>;

