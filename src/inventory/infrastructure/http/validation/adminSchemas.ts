import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
})

export const listProductsQuerySchema = z
  .object({
    q: z.string().optional(),
    active: z.coerce.boolean().optional(),
  })
  .merge(paginationSchema)

export const createProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  costUnit: z.number().min(0),
  active: z.boolean(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  costUnit: z.number().min(0).optional(),
  active: z.boolean().optional(),
})

export const createVariantSchema = z.object({
  attribute: z.string().min(1),
  value: z.string().min(1),
  skuVariant: z.string().min(1).optional(),
  active: z.boolean(),
})

export const updateVariantSchema = z.object({
  attribute: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  skuVariant: z.union([z.string().min(1), z.null()]).optional(),
  active: z.boolean().optional(),
})

export const stockQuerySchema = z.object({
  productId: z.string().min(1).optional(),
  variantId: z.string().min(1).optional(),
})

export const listMovementsQuerySchema = z
  .object({
    productId: z.string().min(1).optional(),
    variantId: z.string().min(1).optional(),
    type: z.enum(['IN', 'OUT', 'ADJUST']).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .merge(paginationSchema)

export const registerReceiptSchema = z.object({
  referenceType: z.enum(['purchase', 'manual']).transform((value) => (value === 'purchase' ? 'PURCHASE' : 'MANUAL')),
  referenceId: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).optional(),
        variant: z
          .object({
            attribute: z.string().min(1),
            value: z.string().min(1),
          })
          .optional(),
        qty: z.number().int().positive(),
        unitCost: z.number().min(0).optional(),
      }).refine((item) => item.variantId || item.variant, {
        message: 'variantId or variant is required',
        path: ['variantId'],
      }),
    )
    .min(1),
})

export const registerAdjustmentSchema = z.object({
  reason: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        qtyDelta: z.number().int().refine((value) => value !== 0, 'qtyDelta must be != 0'),
      }),
    )
    .min(1),
})
