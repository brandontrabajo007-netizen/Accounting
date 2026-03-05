import type { Request, Response } from 'express'
import { movementRepo } from '../../dependencies'
import { listMovementsQuerySchema } from '../../validation/adminSchemas'
import { serializeMovement } from '../../serializers/movementSerializers'
import { ProductId } from '../../../../domain/value-objects/ProductId'
import { VariantId } from '../../../../domain/value-objects/VariantId'

export async function listMovementsHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const query = listMovementsQuerySchema.parse(req.query)

  const result = await movementRepo.list({
    companyId,
    productId: query.productId ? ProductId.from(query.productId) : undefined,
    variantId: query.variantId ? VariantId.from(query.variantId) : undefined,
    type: query.type,
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
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
