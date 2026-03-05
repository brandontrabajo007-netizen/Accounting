import mongoose from 'mongoose'

export type ReservationDoc = {
  _id: string
  companyId: string
  items: Array<{ productId: string; variantId: string; qty: number }>
  status: 'ACTIVE' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const ReservationSchema = new mongoose.Schema<ReservationDoc>(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    items: [
      {
        productId: { type: String, required: true },
        variantId: { type: String, required: true },
        qty: { type: Number, required: true },
      },
    ],
    status: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'inventory_reservations' },
)

ReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const ReservationModel = mongoose.model<ReservationDoc>('InventoryReservation', ReservationSchema)
