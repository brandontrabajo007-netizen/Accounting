import type { VariantRepo } from '../../application/ports/VariantRepo'
import { VariantModel } from '../db/mongo/models/VariantModel'
import type { Variant } from '../../domain/entities/Variant'
import { ProductId } from '../../domain/value-objects/ProductId'
import { VariantId } from '../../domain/value-objects/VariantId'
import { Sku } from '../../domain/value-objects/Sku'

function toDomain(doc: {
  _id: string
  companyId: string
  productId: string
  attribute: string
  value: string
  skuVariant?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}): Variant {
  return {
    id: VariantId.from(doc._id),
    companyId: doc.companyId,
    productId: ProductId.from(doc.productId),
    attribute: doc.attribute,
    value: doc.value,
    skuVariant: doc.skuVariant ? Sku.from(doc.skuVariant) : undefined,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export class MongoVariantRepo implements VariantRepo {
  async getById(companyId: string, id: VariantId): Promise<Variant | null> {
    const doc = await VariantModel.findOne({ _id: id, companyId }).lean().exec()
    return doc ? toDomain(doc) : null
  }

  async listByProductId(companyId: string, productId: ProductId): Promise<ReadonlyArray<Variant>> {
    const docs = await VariantModel.find({ companyId, productId }).lean().exec()
    return docs.map(toDomain)
  }

  async getByProductAndAttributeValue(
    companyId: string,
    productId: ProductId,
    attribute: string,
    value: string,
  ): Promise<Variant | null> {
    const doc = await VariantModel.findOne({ companyId, productId, attribute, value }).lean().exec()
    return doc ? toDomain(doc) : null
  }

  async create(variant: Variant): Promise<void> {
    await VariantModel.create({
      _id: variant.id,
      companyId: variant.companyId,
      productId: variant.productId,
      attribute: variant.attribute,
      value: variant.value,
      skuVariant: variant.skuVariant,
      active: variant.active,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    })
  }

  async update(variant: Variant): Promise<void> {
    await VariantModel.updateOne(
      { _id: variant.id, companyId: variant.companyId },
      {
        $set: {
          attribute: variant.attribute,
          value: variant.value,
          skuVariant: variant.skuVariant,
          active: variant.active,
          updatedAt: variant.updatedAt,
        },
      },
    )
  }

  async deactivate(companyId: string, variantId: VariantId): Promise<void> {
    await VariantModel.updateOne(
      { _id: variantId, companyId },
      {
        $set: {
          active: false,
          updatedAt: new Date(),
        },
      },
    )
  }

  async delete(companyId: string, variantId: VariantId): Promise<void> {
    await VariantModel.deleteOne({ _id: variantId, companyId })
  }
}
