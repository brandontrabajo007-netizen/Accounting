import type { ProductRepo, ProductListQuery, ProductListResult } from '../../application/ports/ProductRepo'
import { ProductModel } from '../db/mongo/models/ProductModel'
import type { Product } from '../../domain/entities/Product'
import { ProductId } from '../../domain/value-objects/ProductId'
import { Sku } from '../../domain/value-objects/Sku'

function normalizeCostUnit(value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'amount' in value) {
    const amount = (value as { amount?: unknown }).amount
    return typeof amount === 'number' ? amount : 0
  }
  return 0
}

function toDomain(doc: {
  _id: string
  companyId: string
  name: string
  sku: string
  costUnit: number | { amount?: number; currency?: string }
  saleUnit?: number | { amount?: number; currency?: string }
  active: boolean
  createdAt: Date
  updatedAt: Date
}): Product {
  const costUnit = normalizeCostUnit(doc.costUnit)
  const saleUnit = normalizeCostUnit(doc.saleUnit ?? doc.costUnit)

  return {
    id: ProductId.from(doc._id),
    companyId: doc.companyId,
    name: doc.name,
    sku: Sku.from(doc.sku),
    costUnit,
    saleUnit,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export class MongoProductRepo implements ProductRepo {
  async getById(companyId: string, id: ProductId): Promise<Product | null> {
    const doc = await ProductModel.findOne({ _id: id, companyId }).lean().exec()
    return doc ? toDomain(doc) : null
  }

  async getBySku(companyId: string, sku: Sku): Promise<Product | null> {
    const doc = await ProductModel.findOne({ companyId, sku }).lean().exec()
    return doc ? toDomain(doc) : null
  }

  async create(product: Product): Promise<void> {
    await ProductModel.create({
      _id: product.id,
      companyId: product.companyId,
      name: product.name,
      sku: product.sku,
      costUnit: product.costUnit,
      saleUnit: product.saleUnit,
      active: product.active,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    })
  }

  async update(product: Product): Promise<void> {
    await ProductModel.updateOne(
      { _id: product.id, companyId: product.companyId },
      {
        $set: {
          name: product.name,
          sku: product.sku,
          costUnit: product.costUnit,
          saleUnit: product.saleUnit,
          active: product.active,
          updatedAt: product.updatedAt,
        },
      },
    )
  }

  async list(query: ProductListQuery): Promise<ProductListResult> {
    const filters: Record<string, unknown> = { companyId: query.companyId }
    if (query.q) {
      filters.$or = [{ name: { $regex: query.q, $options: 'i' } }, { sku: { $regex: query.q, $options: 'i' } }]
    }
    if (typeof query.active === 'boolean') {
      filters.active = query.active
    }

    const skip = (query.page - 1) * query.pageSize
    const [items, total] = await Promise.all([
      ProductModel.find(filters).skip(skip).limit(query.pageSize).lean().exec(),
      ProductModel.countDocuments(filters).exec(),
    ])

    return { items: items.map(toDomain), total }
  }
}
