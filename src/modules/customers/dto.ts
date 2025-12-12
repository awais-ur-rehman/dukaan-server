import { z } from 'zod';

export const updateProfileDto = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  locale: z.string().optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileDto>;

