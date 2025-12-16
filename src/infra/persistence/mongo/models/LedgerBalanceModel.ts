import mongoose, { type Document, Schema } from 'mongoose'

export interface LedgerBalanceDocument extends Document {
  companyId: string
  accountCode: number
  balance: number
  updatedAt: Date
}

const LedgerBalanceSchema = new Schema(
  {
    companyId: { type: String, required: true },
    accountCode: { type: Number, required: true },
    balance: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
)

LedgerBalanceSchema.index({ companyId: 1, accountCode: 1 }, { unique: true })

export const LedgerBalanceMongoModel = mongoose.models.LedgerBalance ?? mongoose.model<LedgerBalanceDocument>('LedgerBalance', LedgerBalanceSchema)
