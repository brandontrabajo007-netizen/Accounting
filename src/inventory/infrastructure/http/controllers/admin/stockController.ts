import type { Request, Response } from 'express'
import { movementRepo, reservationRepo, variantRepo, productRepo } from '../../dependencies'
import { stockQuerySchema } from '../../validation/adminSchemas'
import { computeAvailableStock } from '../../../../domain/services/computeAvailableStock'
import { ProductId } from '../../../../domain/value-objects/ProductId'
import { VariantId } from '../../../../domain/value-objects/VariantId'

export async function getStockHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const query = stockQuerySchema.parse(req.query)

  if (query.variantId) {
    const movements = await movementRepo.listByVariant(companyId, VariantId.from(query.variantId))
    const reservedQty = await reservationRepo.listActiveQtyByVariant(companyId, VariantId.from(query.variantId))
    const stock = computeAvailableStock(movements, reservedQty)
    return res.json({ availableQty: stock.availableQty, reservedQty: stock.reservedQty })
  }

  if (query.productId) {
    const variants = await variantRepo.listByProductId(companyId, ProductId.from(query.productId))
    let totalAvailable = 0
    let totalReserved = 0

    for (const variant of variants) {
      const movements = await movementRepo.listByProductAndVariant(companyId, variant.productId, variant.id)
      const reservedQty = await reservationRepo.listActiveQtyByVariant(companyId, variant.id)
      const stock = computeAvailableStock(movements, reservedQty)
      totalAvailable += stock.availableQty
      totalReserved += stock.reservedQty
    }

    return res.json({ availableQty: totalAvailable, reservedQty: totalReserved })
  }

  return res.status(400).json({ ok: false, error: 'productId or variantId is required' })
}

export async function getProductStockHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { productId } = req.params
  const variants = await variantRepo.listByProductId(companyId, ProductId.from(productId))

  const items = [] as Array<{ variantId: string; availableQty: number; reservedQty: number }>
  for (const variant of variants) {
    const movements = await movementRepo.listByProductAndVariant(companyId, variant.productId, variant.id)
    const reservedQty = await reservationRepo.listActiveQtyByVariant(companyId, variant.id)
    const stock = computeAvailableStock(movements, reservedQty)
    items.push({ variantId: variant.id, availableQty: stock.availableQty, reservedQty: stock.reservedQty })
  }

  return res.json({ productId, items })
}

export async function getVariantStockHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { variantId } = req.params
  const movements = await movementRepo.listByVariant(companyId, VariantId.from(variantId))
  const reservedQty = await reservationRepo.listActiveQtyByVariant(companyId, VariantId.from(variantId))
  const stock = computeAvailableStock(movements, reservedQty)

  return res.json({ variantId, availableQty: stock.availableQty, reservedQty: stock.reservedQty })
}

export async function getGlobalStockHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const products = await productRepo.list({
    companyId,
    page: 1,
    pageSize: 10000,
  })

  const items: Array<{
    productId: string
    productName: string
    variantId: string
    variantLabel: string
    availableQty: number
    reservedQty: number
  }> = []

  for (const product of products.items) {
    const variants = await variantRepo.listByProductId(companyId, product.id)
    for (const variant of variants) {
      const movements = await movementRepo.listByProductAndVariant(companyId, product.id, variant.id)
      const reservedQty = await reservationRepo.listActiveQtyByVariant(companyId, variant.id)
      const stock = computeAvailableStock(movements, reservedQty)

      items.push({
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantLabel: `${variant.attribute} ${variant.value}`.trim(),
        availableQty: stock.availableQty,
        reservedQty: stock.reservedQty,
      })
    }
  }

  return res.json({ items })
}
