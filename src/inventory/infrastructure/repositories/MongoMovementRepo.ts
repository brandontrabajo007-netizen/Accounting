import type { MovementRepo, MovementListQuery, MovementListResult } from '../../application/ports/MovementRepo'
import { MovementModel } from '../db/mongo/models/MovementModel'
import type { InventoryMovement, MovementReferenceType } from '../../domain/entities/InventoryMovement'
import { ProductId } from '../../domain/value-objects/ProductId'
import { Quantity } from '../../domain/value-objects/Quantity'
import { VariantId } from '../../domain/value-objects/VariantId'

function toDomain(doc: {
  _id: string
  companyId: string
  productId: string
  productNameSnapshot?: string
  productSkuSnapshot?: string
  productDeleted?: boolean
  variantId: string
  type: 'IN' | 'OUT' | 'ADJUST'
  qty?: number
  qtyDelta?: number
  occurredAt: Date
  reference: { type: MovementReferenceType; id: string }
  batchId: string
  note?: string
  createdAt: Date
}): InventoryMovement {
  if (doc.type === 'ADJUST') {
    return {
      id: doc._id,
      companyId: doc.companyId,
      productId: ProductId.from(doc.productId),
      productNameSnapshot: doc.productNameSnapshot,
      productSkuSnapshot: doc.productSkuSnapshot,
      productDeleted: doc.productDeleted,
      variantId: VariantId.from(doc.variantId),
      type: 'ADJUST',
      qtyDelta: doc.qtyDelta ?? 0,
      occurredAt: doc.occurredAt,
      reference: doc.reference,
      batchId: doc.batchId,
      note: doc.note,
      createdAt: doc.createdAt,
    }
  }

  return {
    id: doc._id,
    companyId: doc.companyId,
    productId: ProductId.from(doc.productId),
    productNameSnapshot: doc.productNameSnapshot,
    productSkuSnapshot: doc.productSkuSnapshot,
    productDeleted: doc.productDeleted,
    variantId: VariantId.from(doc.variantId),
    type: doc.type,
    qty: Quantity.from(doc.qty ?? 0),
    occurredAt: doc.occurredAt,
    reference: doc.reference,
    batchId: doc.batchId,
    note: doc.note,
    createdAt: doc.createdAt,
  }
}

export class MongoMovementRepo implements MovementRepo {
  async addMany(movements: ReadonlyArray<InventoryMovement>): Promise<void> {
    const docs = movements.map((m) => {
      if (m.type === 'ADJUST') {
        return {
          _id: m.id,
          companyId: m.companyId,
          productId: m.productId,
          productNameSnapshot: m.productNameSnapshot,
          productSkuSnapshot: m.productSkuSnapshot,
          productDeleted: m.productDeleted,
          variantId: m.variantId,
          type: m.type,
          qtyDelta: m.qtyDelta,
          occurredAt: m.occurredAt,
          reference: m.reference,
          batchId: m.batchId,
          note: m.note,
          createdAt: m.createdAt,
        }
      }
      return {
        _id: m.id,
        companyId: m.companyId,
        productId: m.productId,
        productNameSnapshot: m.productNameSnapshot,
        productSkuSnapshot: m.productSkuSnapshot,
        productDeleted: m.productDeleted,
        variantId: m.variantId,
        type: m.type,
        qty: m.qty,
        occurredAt: m.occurredAt,
        reference: m.reference,
        batchId: m.batchId,
        note: m.note,
        createdAt: m.createdAt,
      }
    })

    if (docs.length > 0) {
      await MovementModel.insertMany(docs, { ordered: true })
    }
  }

  async findByReference(
    companyId: string,
    referenceType: MovementReferenceType,
    referenceId: string,
  ): Promise<ReadonlyArray<InventoryMovement>> {
    const docs = await MovementModel.find({
      companyId,
      'reference.type': referenceType,
      'reference.id': referenceId,
    })
      .lean()
      .exec()
    return docs.map(toDomain)
  }

  async list(query: MovementListQuery): Promise<MovementListResult> {
    const filters: Record<string, unknown> = { companyId: query.companyId }
    if (query.productId) {
      filters.productId = query.productId
    }
    if (query.variantId) {
      filters.variantId = query.variantId
    }
    if (query.type) {
      filters.type = query.type
    }
    if (query.from || query.to) {
      const occurredAt: { $gte?: Date; $lte?: Date } = {}
      if (query.from) {
        occurredAt.$gte = query.from
      }
      if (query.to) {
        occurredAt.$lte = query.to
      }
      filters.occurredAt = occurredAt
    }

    const skip = (query.page - 1) * query.pageSize
    const [items, total] = await Promise.all([
      MovementModel.find(filters).skip(skip).limit(query.pageSize).sort({ occurredAt: -1 }).lean().exec(),
      MovementModel.countDocuments(filters).exec(),
    ])

    return { items: items.map(toDomain), total }
  }

  async listByProductAndVariant(
    companyId: string,
    productId: ProductId,
    variantId: VariantId,
  ): Promise<ReadonlyArray<InventoryMovement>> {
    const docs = await MovementModel.find({ companyId, productId, variantId }).lean().exec()
    return docs.map(toDomain)
  }

  async listByProduct(companyId: string, productId: ProductId): Promise<ReadonlyArray<InventoryMovement>> {
    const docs = await MovementModel.find({ companyId, productId }).lean().exec()
    return docs.map(toDomain)
  }

  async listByVariant(companyId: string, variantId: VariantId): Promise<ReadonlyArray<InventoryMovement>> {
    const docs = await MovementModel.find({ companyId, variantId }).lean().exec()
    return docs.map(toDomain)
  }

  async existsByProduct(companyId: string, productId: ProductId): Promise<boolean> {
    const doc = await MovementModel.findOne({ companyId, productId }).select({ _id: 1 }).lean().exec()
    return !!doc
  }

  async existsByVariant(companyId: string, variantId: VariantId): Promise<boolean> {
    const doc = await MovementModel.findOne({ companyId, variantId }).select({ _id: 1 }).lean().exec()
    return !!doc
  }

  async stampDeletedProductSnapshot(
    companyId: string,
    productId: ProductId,
    snapshot: Readonly<{ name: string; sku: string }>,
  ): Promise<void> {
    await MovementModel.updateMany(
      { companyId, productId },
      {
        $set: {
          productNameSnapshot: snapshot.name,
          productSkuSnapshot: snapshot.sku,
          productDeleted: true,
        },
      },
    )
  }

  async existsByCompany(companyId: string): Promise<boolean> {
    const doc = await MovementModel.findOne({ companyId }).select({ _id: 1 }).lean().exec()
    return Boolean(doc)
  }
}
