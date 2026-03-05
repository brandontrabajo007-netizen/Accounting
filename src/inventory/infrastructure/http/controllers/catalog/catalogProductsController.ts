import type { Request, Response } from 'express'
import { productRepo, variantRepo, movementRepo, reservationRepo } from '../../dependencies'
import { catalogCompanyQuerySchema, catalogListQuerySchema } from '../../validation/catalogSchemas'
import { serializeCatalogProduct } from '../../serializers/productSerializers'
import { serializeVariant } from '../../serializers/variantSerializers'
import { computeAvailableStock } from '../../../../domain/services/computeAvailableStock'
import { ProductId } from '../../../../domain/value-objects/ProductId'

export async function listCatalogProductsHandler(req: Request, res: Response) {
  const query = catalogListQuerySchema.parse(req.query)
  const result = await productRepo.list({
    companyId: query.companyId,
    q: query.q,
    active: true,
    page: query.page,
    pageSize: query.pageSize,
  })

  return res.json({
    items: result.items.map(serializeCatalogProduct),
    page: query.page,
    pageSize: query.pageSize,
    total: result.total,
  })
}

export async function getCatalogProductHandler(req: Request, res: Response) {
  const query = catalogCompanyQuerySchema.parse(req.query)
  const { productId } = req.params
  const product = await productRepo.getById(query.companyId, ProductId.from(productId))
  if (!product || !product.active) {
    return res.status(404).json({ ok: false, error: 'ProductNotFound' })
  }

  const variants = await variantRepo.listByProductId(query.companyId, ProductId.from(productId))
  const activeVariants = variants.filter((variant) => variant.active)

  return res.json({
    product: serializeCatalogProduct(product),
    variants: activeVariants.map(serializeVariant),
  })
}

export async function getCatalogAvailabilityHandler(req: Request, res: Response) {
  const query = catalogCompanyQuerySchema.parse(req.query)
  const { productId } = req.params
  const product = await productRepo.getById(query.companyId, ProductId.from(productId))
  if (!product || !product.active) {
    return res.status(404).json({ ok: false, error: 'ProductNotFound' })
  }
  const variants = await variantRepo.listByProductId(query.companyId, ProductId.from(productId))
  const activeVariants = variants.filter((variant) => variant.active)

  const items = [] as Array<{ variantId: string; availableQty: number }>

  for (const variant of activeVariants) {
    const movements = await movementRepo.listByProductAndVariant(query.companyId, variant.productId, variant.id)
    const reservedQty = await reservationRepo.listActiveQtyByVariant(query.companyId, variant.id)
    const stock = computeAvailableStock(movements, reservedQty)
    items.push({ variantId: variant.id, availableQty: stock.availableQty })
  }

  return res.json({ items })
}
