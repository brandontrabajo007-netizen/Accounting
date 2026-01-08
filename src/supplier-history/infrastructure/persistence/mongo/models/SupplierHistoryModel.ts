import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface SupplierHistoryDocument extends Document {
  companyId: string
  supplierId: string
  type: 'purchase' | 'payment'
  amount: number
  date: Date
  description?: string
  paymentMethod?: string
  journalEntryId?: string
  createdAt: Date
  updatedAt: Date
}

const SupplierHistorySchema = new Schema<SupplierHistoryDocument>(
  {
    companyId: { type: String, required: true, index: true },
    supplierId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['purchase', 'payment'] },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    paymentMethod: { type: String },
    journalEntryId: { type: String },
  },
  { timestamps: true },
)

SupplierHistorySchema.index({ companyId: 1, supplierId: 1, date: 1 })

export const SupplierHistoryMongoModel: Model<SupplierHistoryDocument> =
  mongoose.models.SupplierHistory ?? mongoose.model<SupplierHistoryDocument>('SupplierHistory', SupplierHistorySchema)
