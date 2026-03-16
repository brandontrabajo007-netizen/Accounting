import mongoose from 'mongoose'

export type ProductDoc = {
  _id: string
  companyId: string
  name: string
  sku: string
  costUnit: number
  saleUnit?: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new mongoose.Schema<ProductDoc>(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    costUnit: { type: Number, required: true },
    saleUnit: { type: Number, required: false },
    active: { type: Boolean, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'inventory_products' },
)

ProductSchema.index({ companyId: 1, sku: 1 }, { unique: true })

export const ProductModel = mongoose.model<ProductDoc>('InventoryProduct', ProductSchema)
