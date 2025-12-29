import mongoose, { Schema, type Document } from 'mongoose'

export interface PeriodResultDocument extends Document {
  id: string
  companyId: string
  periodId: string
  period: {
    start: Date
    end: Date
  }
  incomeStatement: unknown
  generatedAt: Date
}

const PeriodResultSchema = new Schema<PeriodResultDocument>(
  {
    id: { type: String, required: true, unique: true },
    companyId: { type: String, required: true, index: true },
    periodId: { type: String, required: true, index: true },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    incomeStatement: { type: Schema.Types.Mixed, required: true },
    generatedAt: { type: Date, required: true },
  },
  {
    collection: 'periodresults',
    timestamps: true,
  },
)

PeriodResultSchema.index({ companyId: 1, periodId: 1 }, { unique: true })

export const PeriodResultModel = mongoose.model<PeriodResultDocument>('PeriodResult', PeriodResultSchema)
