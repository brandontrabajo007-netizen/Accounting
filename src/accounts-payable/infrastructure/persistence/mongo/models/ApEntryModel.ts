import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface ApEntryDocument extends Document {
  companyId: string
  supplierId: string
  type: 'debit' | 'credit'
  amount: number
  date: Date
  source: {
    kind: 'purchase' | 'payment' | 'manual'
    referenceId?: string
    note?: string
  }
  createdAt: Date
  updatedAt: Date
}

const ApEntrySchema = new Schema<ApEntryDocument>(
  {
    companyId: { type: String, required: true, index: true },
    supplierId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ['debit', 'credit'] },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    source: {
      kind: { type: String, required: true, enum: ['purchase', 'payment', 'manual'] },
      referenceId: { type: String },
      note: { type: String },
    },
  },
  { timestamps: true },
)

ApEntrySchema.index({ companyId: 1, supplierId: 1, date: 1 })

export const ApEntryMongoModel: Model<ApEntryDocument> =
  mongoose.models.ApEntry ?? mongoose.model<ApEntryDocument>('ApEntry', ApEntrySchema)
