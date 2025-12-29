import mongoose, { Schema, type Document } from 'mongoose'

export interface LedgerSnapshotDocument extends Document {
  id: string
  companyId: string
  periodId: string
  period: {
    start: Date
    end: Date
  }
  lines: {
    accountCode: number
    accountName: string
    balance: number
  }[]
  generatedAt: Date
}

const LedgerSnapshotLineSchema = new Schema(
  {
    accountCode: { type: Number, required: true },
    accountName: { type: String, required: true },
    balance: { type: Number, required: true },
  },
  { _id: false },
)

const LedgerSnapshotSchema = new Schema<LedgerSnapshotDocument>(
  {
    id: { type: String, required: true, unique: true },
    companyId: { type: String, required: true, index: true },
    periodId: { type: String, required: true, index: true },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    lines: { type: [LedgerSnapshotLineSchema], required: true },
    generatedAt: { type: Date, required: true },
  },
  {
    collection: 'ledgersnapshots',
    timestamps: true,
  },
)

LedgerSnapshotSchema.index({ companyId: 1, periodId: 1 }, { unique: true })
LedgerSnapshotSchema.index({ companyId: 1, 'lines.accountCode': 1 })

export const LedgerSnapshotModel = mongoose.model<LedgerSnapshotDocument>('LedgerSnapshot', LedgerSnapshotSchema)
