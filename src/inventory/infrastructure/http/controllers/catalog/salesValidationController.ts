import type { Request, Response } from 'express'
import { validateSaleCart } from '../../dependencies'
import { validateSaleSchema } from '../../validation/catalogSchemas'

export async function validateSaleHandler(req: Request, res: Response) {
  const body = validateSaleSchema.parse(req.body)
  const result = await validateSaleCart({ companyId: body.companyId, items: body.items })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: result.value.ok, issues: result.value.issues, normalizedItems: body.items })
}
