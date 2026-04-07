import type { Request, Response } from 'express'
import { movementRepo } from '../../dependencies'
import { listMovementsQuerySchema } from '../../validation/adminSchemas'
import { serializeMovement } from '../../serializers/movementSerializers'
import { ProductId } from '../../../../domain/value-objects/ProductId'
import { VariantId } from '../../../../domain/value-objects/VariantId'

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

const parseDateFilter = (value: string, bound: 'from' | 'to'): Date => {
  if (dateOnlyPattern.test(value)) {
    return new Date(bound === 'from' ? `${value}T00:00:00.000Z` : `${value}T23:59:59.999Z`)
  }
  return new Date(value)
}

export async function listMovementsHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const parsed = listMovementsQuerySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'Filtros invalidos. Usa from/to como YYYY-MM-DD o ISO datetime.',
      details: parsed.error.flatten(),
    })
  }
  const query = parsed.data

  const from = query.from ? parseDateFilter(query.from, 'from') : undefined
  const to = query.to ? parseDateFilter(query.to, 'to') : undefined
  if (from && to && to < from) {
    return res.status(400).json({ ok: false, error: 'Rango invalido: to debe ser mayor o igual a from.' })
  }

  const result = await movementRepo.list({
    companyId,
    productId: query.productId ? ProductId.from(query.productId) : undefined,
    variantId: query.variantId ? VariantId.from(query.variantId) : undefined,
    type: query.type,
    from,
    to,
    page: query.page,
    pageSize: query.pageSize,
  })

  return res.json({
    items: result.items.map(serializeMovement),
    page: query.page,
    pageSize: query.pageSize,
    total: result.total,
  })
}
