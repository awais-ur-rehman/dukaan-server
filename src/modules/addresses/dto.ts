import { z } from 'zod';

export const createAddressDto = z.object({
  label: z.string().min(1, 'Label is required'),
  addressText: z.string().min(1, 'Address text is required'),
  geo: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  phone: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

export const updateAddressDto = createAddressDto.partial();

export type CreateAddressRequest = z.infer<typeof createAddressDto>;
export type UpdateAddressRequest = z.infer<typeof updateAddressDto>;

