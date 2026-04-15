import type { Request, Response } from 'express'
import { productRepo, createProduct, updateProduct, deactivateProduct, deleteProduct } from '../../dependencies'
import { createProductSchema, listProductsQuerySchema, updateProductSchema } from '../../validation/adminSchemas'
import { serializeAdminProduct } from '../../serializers/productSerializers'
import { ProductId } from '../../../../domain/value-objects/ProductId'

export async function createProductHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const body = createProductSchema.parse(req.body)
  const result = await createProduct({ companyId, ...body })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.status(201).json({ ok: true, productId: result.value.productId })
}

export async function listProductsHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const query = listProductsQuerySchema.parse(req.query)
  const result = await productRepo.list({
    companyId,
    q: query.q,
    active: query.active,
    page: query.page,
    pageSize: query.pageSize,
  })

  return res.json({
    items: result.items.map(serializeAdminProduct),
    page: query.page,
    pageSize: query.pageSize,
    total: result.total,
  })
}

export async function getProductHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { productId } = req.params
  const product = await productRepo.getById(companyId, ProductId.from(productId))
  if (!product) {
    return res.status(404).json({ ok: false, error: 'ProductNotFound' })
  }
  return res.json({ item: serializeAdminProduct(product) })
}

export async function updateProductHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { productId } = req.params
  const body = updateProductSchema.parse(req.body)
  const result = await updateProduct({ companyId, productId, ...body })

  if (!result.ok) {
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: true, item: serializeAdminProduct(result.value.product) })
}

export async function deleteProductHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { productId } = req.params
  const result = await deactivateProduct({ companyId, productId })

  if (!result.ok) {
    if (result.error.type === 'ProductNotFound') {
      return res.status(404).json({ ok: false, error: result.error })
    }
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: true })
}

export async function deleteProductHardHandler(req: Request, res: Response) {
  const companyId = req.user!.companyId
  const { productId } = req.params
  const result = await deleteProduct({ companyId, productId })

  if (!result.ok) {
    if (result.error.type === 'ProductNotFound') {
      return res.status(404).json({ ok: false, error: result.error })
    }
    if (result.error.type === 'ProductHasActiveReservations') {
      return res.status(409).json({ ok: false, error: result.error })
    }
    return res.status(400).json({ ok: false, error: result.error })
  }

  return res.json({ ok: true })
}
