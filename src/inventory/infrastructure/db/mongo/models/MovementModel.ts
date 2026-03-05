import mongoose from 'mongoose'

export type MovementDoc = {
  _id: string
  companyId: string
  productId: string
  variantId: string
  type: 'IN' | 'OUT' | 'ADJUST'
  qty?: number
  qtyDelta?: number
  occurredAt: Date
  reference: { type: 'SALE' | 'PURCHASE' | 'MANUAL' | 'ADJUSTMENT' | 'REVERSAL'; id: string }
  batchId: string
  note?: string
  createdAt: Date
}

const MovementSchema = new mongoose.Schema<MovementDoc>(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    variantId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    qty: { type: Number, required: false },
    qtyDelta: { type: Number, required: false },
    occurredAt: { type: Date, required: true },
    reference: {
      type: { type: String, required: true },
      id: { type: String, required: true },
    },
    batchId: { type: String, required: true, index: true },
    note: { type: String, required: false },
    createdAt: { type: Date, required: true },
  },
  { collection: 'inventory_movements' },
)

MovementSchema.index(
  { companyId: 1, 'reference.type': 1, 'reference.id': 1, productId: 1, variantId: 1 },
  { unique: true },
)

export const MovementModel = mongoose.model<MovementDoc>('InventoryMovement', MovementSchema)
