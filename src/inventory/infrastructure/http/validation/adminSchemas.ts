import { z } from 'zod'

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

const dateFilterSchema = z.string().trim().refine((value) => {
  if (dateOnlyPattern.test(value)) {
    return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
  }

  return !Number.isNaN(new Date(value).getTime())
}, 'Use YYYY-MM-DD or ISO datetime')

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
  saleUnit: z.number().min(0).optional(),
  active: z.boolean(),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  costUnit: z.number().min(0).optional(),
  saleUnit: z.number().min(0).optional(),
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

export const updateInventorySettingsSchema = z.object({
  mode: z.enum(['SIMPLE', 'VARIANT']),
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
    from: dateFilterSchema.optional(),
    to: dateFilterSchema.optional(),
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
        variantId: z.string().min(1).optional(),
        qtyDelta: z.number().int().refine((value) => value !== 0, 'qtyDelta must be != 0'),
      }),
    )
    .min(1),
})
