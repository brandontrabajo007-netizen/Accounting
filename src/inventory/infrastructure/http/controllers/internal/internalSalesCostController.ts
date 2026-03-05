import type { Request, Response } from 'express'
import { getSaleCost } from '../../dependencies'
import { internalCostSchema } from '../../validation/internalSchemas'

export async function internalSaleCostHandler(req: Request, res: Response) {
  const body = internalCostSchema.parse(req.body)
  if (req.user?.companyId && req.user.companyId !== body.companyId) {
    return res.status(403).json({ ok: false, error: 'Acceso denegado' })
  }
  const result = await getSaleCost(body)

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json(result.value)
}
