import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface CustomerHistoryDocument extends Document {
  companyId: string
  customerId: string
  type: 'sale' | 'payment'
  amount: number
  date: Date
  description?: string
  paymentMethod?: string
  journalEntryId?: string
  createdAt: Date
  updatedAt: Date
}

const CustomerHistorySchema = new Schema<CustomerHistoryDocument>(
  {
    companyId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['sale', 'payment'] },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: { type: String },
    paymentMethod: { type: String },
    journalEntryId: { type: String },
  },
  { timestamps: true },
)

CustomerHistorySchema.index({ companyId: 1, customerId: 1, date: 1 })

export const CustomerHistoryMongoModel: Model<CustomerHistoryDocument> =
  mongoose.models.CustomerHistory ?? mongoose.model<CustomerHistoryDocument>('CustomerHistory', CustomerHistorySchema)
