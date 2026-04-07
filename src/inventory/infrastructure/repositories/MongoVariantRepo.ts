import type { VariantRepo } from '../../application/ports/VariantRepo'
import { VariantModel } from '../db/mongo/models/VariantModel'
import type { Variant } from '../../domain/entities/Variant'
import { ProductId } from '../../domain/value-objects/ProductId'
import { VariantId } from '../../domain/value-objects/VariantId'
import { Sku } from '../../domain/value-objects/Sku'

type VariantDoc = {
  _id: string
  companyId: string
  productId: string
  attribute: string
  value: string
  skuVariant?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const textCollator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' })

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const parseNumericVariantValue = (value: string): number | null => {
  const cleaned = value.trim().replace(',', '.')
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const sizeRank = new Map<string, number>([
  ['xxs', 1],
  ['xs', 2],
  ['s', 3],
  ['m', 4],
  ['l', 5],
  ['xl', 6],
  ['xxl', 7],
  ['2xl', 7],
  ['xxxl', 8],
  ['3xl', 8],
  ['xxxxl', 9],
  ['4xl', 9],
])

const compareVariantDocs = (left: VariantDoc, right: VariantDoc): number => {
  const leftAttr = normalizeText(left.attribute)
  const rightAttr = normalizeText(right.attribute)
  const attrOrder = textCollator.compare(leftAttr, rightAttr)
  if (attrOrder !== 0) return attrOrder

  const isSizeAttribute = /\b(talla|size)\b/.test(leftAttr)
  if (isSizeAttribute) {
    const leftNumber = parseNumericVariantValue(left.value)
    const rightNumber = parseNumericVariantValue(right.value)
    if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) {
      return leftNumber - rightNumber
    }
    if (leftNumber !== null && rightNumber === null) return -1
    if (leftNumber === null && rightNumber !== null) return 1

    const leftSizeToken = normalizeText(left.value).replace(/\s+/g, '')
    const rightSizeToken = normalizeText(right.value).replace(/\s+/g, '')
    const leftSizeRank = sizeRank.get(leftSizeToken)
    const rightSizeRank = sizeRank.get(rightSizeToken)
    if (leftSizeRank !== undefined && rightSizeRank !== undefined && leftSizeRank !== rightSizeRank) {
      return leftSizeRank - rightSizeRank
    }
    if (leftSizeRank !== undefined && rightSizeRank === undefined) return -1
    if (leftSizeRank === undefined && rightSizeRank !== undefined) return 1
  } else {
    const createdOrder = left.createdAt.getTime() - right.createdAt.getTime()
    if (createdOrder !== 0) return createdOrder
  }

  const valueOrder = textCollator.compare(left.value, right.value)
  if (valueOrder !== 0) return valueOrder

  return textCollator.compare(left._id, right._id)
}

function toDomain(doc: VariantDoc): Variant {
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
    const docs = (await VariantModel.find({ companyId, productId }).lean().exec()) as VariantDoc[]
    docs.sort(compareVariantDocs)
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
