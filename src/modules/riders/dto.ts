import { z } from 'zod';

export const createRiderDto = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  vehicleType: z.string().optional(),
});

export const updateRiderDto = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  vehicleType: z.string().optional(),
  active: z.boolean().optional(),
});

export type CreateRiderRequest = z.infer<typeof createRiderDto>;
export type UpdateRiderRequest = z.infer<typeof updateRiderDto>;

