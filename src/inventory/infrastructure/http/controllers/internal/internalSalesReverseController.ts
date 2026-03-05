import type { Request, Response } from 'express'
import { reverseSale } from '../../dependencies'
import { internalReverseSchema } from '../../validation/internalSchemas'

export async function internalSaleReverseHandler(req: Request, res: Response) {
  const body = internalReverseSchema.parse(req.body)
  if (req.user?.companyId && req.user.companyId !== body.companyId) {
    return res.status(403).json({ ok: false, error: 'Acceso denegado' })
  }
  const result = await reverseSale(body)

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: true, movementBatchId: result.value.movementBatchId })
}
