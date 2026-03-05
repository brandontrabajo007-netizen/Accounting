import type { Request, Response } from 'express'
import { createVariant, updateVariant, deactivateVariant, deleteVariant, variantRepo } from '../../dependencies'
import { createVariantSchema, updateVariantSchema } from '../../validation/adminSchemas'
import { serializeVariant } from '../../serializers/variantSerializers'
import { ProductId } from '../../../../domain/value-objects/ProductId'

export async function createVariantHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { productId } = req.params
  const body = createVariantSchema.parse(req.body)
  const result = await createVariant({
    companyId,
    productId,
    attribute: body.attribute,
    value: body.value,
    skuVariant: body.skuVariant,
    active: body.active,
  })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.status(201).json({ ok: true, variantId: result.value.variantId })
}

export async function listVariantsHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { productId } = req.params
  const variants = await variantRepo.listByProductId(companyId, ProductId.from(productId))
  return res.json({ items: variants.map(serializeVariant) })
}

export async function updateVariantHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { variantId } = req.params
  const body = updateVariantSchema.parse(req.body)
  const result = await updateVariant({ companyId, variantId, ...body })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: true, item: serializeVariant(result.value.variant) })
}

export async function deleteVariantHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { variantId } = req.params
  const result = await deactivateVariant({ companyId, variantId })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: true })
}

export async function deleteVariantHardHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { variantId } = req.params
  const result = await deleteVariant({ companyId, variantId })

  if (!result.ok) {
    if (result.error.type === 'VariantHasMovements') {
      return res.status(409).json({ ok: false, error: result.error })
    }
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: true })
}
