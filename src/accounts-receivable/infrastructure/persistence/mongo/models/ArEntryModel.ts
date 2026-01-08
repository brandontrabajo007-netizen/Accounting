import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface ArEntryDocument extends Document {
  companyId: string
  customerId: string
  type: 'debit' | 'credit'
  amount: number
  date: Date
  source: {
    kind: 'sale' | 'payment' | 'manual'
    referenceId?: string
    note?: string
  }
  createdAt: Date
  updatedAt: Date
}

const ArEntrySchema = new Schema<ArEntryDocument>(
  {
    companyId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['debit', 'credit'] },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    source: {
      kind: { type: String, required: true, enum: ['sale', 'payment', 'manual'] },
      referenceId: { type: String },
      note: { type: String },
    },
  },
  { timestamps: true },
)

ArEntrySchema.index({ companyId: 1, customerId: 1, date: 1 })

export const ArEntryMongoModel: Model<ArEntryDocument> =
  mongoose.models.ArEntry ?? mongoose.model<ArEntryDocument>('ArEntry', ArEntrySchema)
