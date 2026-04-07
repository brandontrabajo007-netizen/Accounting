import { z } from 'zod'

export const catalogListQuerySchema = z.object({
  companyId: z.string().min(1),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
})

export const catalogCompanyQuerySchema = z.object({
  companyId: z.string().min(1),
})

export const validateSaleSchema = z.object({
  companyId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
})

export const createReservationSchema = z.object({
  companyId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
  ttlMinutes: z.number().int().min(1).max(1440),
})

export const cancelReservationSchema = z.object({
  reason: z.string().min(1),
})
