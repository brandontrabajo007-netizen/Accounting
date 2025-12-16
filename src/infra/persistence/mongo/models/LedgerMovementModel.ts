import { MovementStatus } from '@domain/movements/MovementStatus'
import mongoose, { type Document, type Model, Schema } from 'mongoose'

export interface LedgerMovementDocument extends Document {
  accountCode: number
  debit: number
  credit: number
  date: Date
  journalEntryId: string
  description: string
  companyId: string
  status: MovementStatus
}

const LedgerMovementSchema = new Schema<LedgerMovementDocument>(
  {
    accountCode: { type: Number, required: true },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    date: { type: Date, required: true },
    journalEntryId: { type: String, required: true },
    description: { type: String, required: true },
    companyId: { type: String, required: true },
    status: { type: String, enum: Object.values(MovementStatus), default: MovementStatus.PROCESSED },
  },
  { timestamps: true },
)

export const LedgerMovementMongoModel: Model<LedgerMovementDocument> = mongoose.models.LedgerMovement ?? mongoose.model<LedgerMovementDocument>('LedgerMovement', LedgerMovementSchema)
