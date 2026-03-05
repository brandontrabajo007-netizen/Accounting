import type { Request, Response } from 'express'
import { registerAdjustment } from '../../dependencies'
import { registerAdjustmentSchema } from '../../validation/adminSchemas'

export async function registerAdjustmentHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const body = registerAdjustmentSchema.parse(req.body)
  const result = await registerAdjustment({ companyId, reason: body.reason, items: body.items })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.status(201).json({ ok: true, movementBatchId: result.value.movementBatchId })
}
