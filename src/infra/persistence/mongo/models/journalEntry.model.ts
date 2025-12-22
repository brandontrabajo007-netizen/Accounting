import type { EventType } from '@domain/events/EventType.enum'
import type { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { Movement } from '@domain/movements/Movement'
import mongoose, { type Document, type PaginateModel, Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'

export interface JournalEntryDocument extends Document {
  id: string
  companyId: string
  journalNumber?: number
  date: Date
  description: string
  status: JournalEntryStatus
  movements: Movement[]
  eventType?: EventType
}

const MovementSchema = new Schema<Movement>(
  {
    accountCode: { type: Number, required: true },
    accountName: { type: String, required: true },
    type: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true },
    group: { type: String, required: true },
  },
  { _id: false },
)

const JournalEntrySchema = new Schema<JournalEntryDocument>(
  {
    id: { type: String, required: true, unique: true },
    companyId: { type: String, required: true, index: true },
    journalNumber: { type: Number },
    date: { type: Date, required: true, index: true },
    description: { type: String, required: true },
    status: { type: String, required: true },
    movements: { type: [MovementSchema], required: true },
    eventType: { type: String },
  },
  {
    timestamps: true,
    collection: 'journalentries',
  },
)

JournalEntrySchema.plugin(mongoosePaginate)

export const JournalEntryModel = mongoose.model<JournalEntryDocument, PaginateModel<JournalEntryDocument>>('JournalEntry', JournalEntrySchema)
