import mongoose from 'mongoose'

export type VariantDoc = {
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

const VariantSchema = new mongoose.Schema<VariantDoc>(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    attribute: { type: String, required: true },
    value: { type: String, required: true },
    skuVariant: { type: String, required: false },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'inventory_variants' },
)

VariantSchema.index(
  { companyId: 1, productId: 1, attribute: 1, value: 1, active: 1 },
  { unique: true },
)

export const VariantModel = mongoose.model<VariantDoc>('InventoryVariant', VariantSchema)
