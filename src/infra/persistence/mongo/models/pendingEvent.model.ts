import mongoose, { type Document, type Model, Schema } from 'mongoose'
import type { PendingEventStatus } from '@application/pending-events/PendingEvent'

interface PendingEventDocument extends Document {
  companyId: string
  telegramUserId: number
  eventType: string
  interpretedData: Record<string, unknown>
  metadata?: Record<string, unknown> | null
  status: PendingEventStatus
  expiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

const PendingEventSchema = new Schema<PendingEventDocument>(
  {
    companyId: { type: String, required: true, index: true },
    telegramUserId: { type: Number, required: true, index: true },
    eventType: { type: String, required: true },
    interpretedData: { type: Schema.Types.Mixed, required: true },
    metadata: { type: Schema.Types.Mixed, default: null },
    status: { type: String, required: true, index: true, enum: ['PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'EXPIRED'] },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
)

export const PendingEventMongoModel: Model<PendingEventDocument> =
  mongoose.models.PendingEvent ?? mongoose.model<PendingEventDocument>('PendingEvent', PendingEventSchema)
