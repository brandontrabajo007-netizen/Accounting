import type { Request, Response } from 'express'
import { confirmSale } from '../../dependencies'
import { internalConfirmSchema } from '../../validation/internalSchemas'

export async function internalSaleConfirmHandler(req: Request, res: Response) {
  const body = internalConfirmSchema.parse(req.body)
  if (req.user?.companyId && req.user.companyId !== body.companyId) {
    return res.status(403).json({ ok: false, error: 'Acceso denegado' })
  }
  const result = await confirmSale(body)

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({
    ok: true,
    movementBatchId: result.value.movementBatchId,
    costTotal: result.value.costTotal,
  })
}
