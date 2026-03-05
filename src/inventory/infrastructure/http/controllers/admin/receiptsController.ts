import type { Request, Response } from 'express'
import { registerReceipt } from '../../dependencies'
import { registerReceiptSchema } from '../../validation/adminSchemas'

export async function registerReceiptHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const body = registerReceiptSchema.parse(req.body)
  const result = await registerReceipt({
    companyId,
    referenceType: body.referenceType,
    referenceId: body.referenceId,
    items: body.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      variant: item.variant,
      qty: item.qty,
      unitCost: item.unitCost,
    })),
  })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.status(201).json({ ok: true, movementBatchId: result.value.movementBatchId })
}
