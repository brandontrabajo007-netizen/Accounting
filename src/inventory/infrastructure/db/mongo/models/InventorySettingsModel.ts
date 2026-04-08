import mongoose from 'mongoose'

export type InventorySettingsDoc = {
  companyId: string
  mode: 'SIMPLE' | 'VARIANT'
  createdAt: Date
  updatedAt: Date
}

const InventorySettingsSchema = new mongoose.Schema<InventorySettingsDoc>(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    mode: { type: String, enum: ['SIMPLE', 'VARIANT'], required: true, default: 'VARIANT' },
    createdAt: { type: Date, required: true, default: () => new Date() },
    updatedAt: { type: Date, required: true, default: () => new Date() },
  },
  { collection: 'inventory_settings' },
)

InventorySettingsSchema.index({ companyId: 1 }, { unique: true })

export const InventorySettingsModel = mongoose.model<InventorySettingsDoc>('InventorySettings', InventorySettingsSchema)
