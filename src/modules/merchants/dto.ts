import { z } from 'zod';

const multilingualTextSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  ur: z.string().optional(),
});

const addressTextSchema = z.object({
  en: z.string().min(1, 'English address is required'),
  ur: z.string().optional(),
});

const openingHoursSlotSchema = z.object({
  start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
});

const openingHoursSchema = z.object({
  day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  slots: z.array(openingHoursSlotSchema).min(1, 'At least one slot is required'),
});

export const createMerchantDto = z.object({
  ownerUserId: z.string().min(1, 'Owner user ID is required'),
  names: multilingualTextSchema,
  shopAddress: z.object({
    text: addressTextSchema,
    street: z.string().optional(),
  }),
  geo: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  deliveryRadiusMeters: z.number().min(0),
  deliveryCharge: z.number().min(0),
  openingHours: z.array(openingHoursSchema).min(1, 'At least one day is required'),
});

export const updateMerchantDto = createMerchantDto.partial();

export const verifyMerchantDto = z.object({
  approved: z.boolean(),
  notes: z.string().optional(),
});

export const getMerchantsQueryDto = z.object({
  lat: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  lng: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  radius: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
  open: z.string().optional().transform((val) => val === 'true'),
  query: z.string().optional(),
  category: z.string().optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export type CreateMerchantRequest = z.infer<typeof createMerchantDto>;
export type UpdateMerchantRequest = z.infer<typeof updateMerchantDto>;
export type VerifyMerchantRequest = z.infer<typeof verifyMerchantDto>;
export type GetMerchantsQuery = z.infer<typeof getMerchantsQueryDto>;

