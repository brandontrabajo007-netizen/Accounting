import { z } from 'zod'

export const internalCostSchema = z.object({
  companyId: z.string().min(1),
  saleId: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).optional(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
})

export const internalConfirmSchema = z.object({
  companyId: z.string().min(1),
  saleId: z.string().min(1),
  reference: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).optional(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
})

export const internalReverseSchema = z.object({
  companyId: z.string().min(1),
  saleId: z.string().min(1),
  reason: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).optional(),
        qty: z.number().int().positive(),
      }),
    )
    .min(1),
})
