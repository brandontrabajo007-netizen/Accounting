import type { AccountingPeriodStatus } from '@domain/accounting-periods/AccountingPeriodStatus'
import mongoose, { Schema, type Document, Types } from 'mongoose'

export interface AccountingPeriodDocument extends Document {
  _id: Types.ObjectId
  companyId: string
  name?: string
  start: Date
  end: Date
  status: AccountingPeriodStatus
}

const AccountingPeriodSchema = new Schema<AccountingPeriodDocument>(
  {
    companyId: { type: String, required: true, index: true },
    name: { type: String },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    status: { type: String, required: true, index: true },
  },
  {
    collection: 'accountingperiods',
    timestamps: true,
  },
)

AccountingPeriodSchema.index({ companyId: 1, start: 1, end: 1 })

export const AccountingPeriodModel = mongoose.model<AccountingPeriodDocument>('AccountingPeriod', AccountingPeriodSchema)
