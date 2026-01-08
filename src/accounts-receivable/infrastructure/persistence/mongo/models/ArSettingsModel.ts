import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface ArSettingsDocument extends Document {
  companyId: string
  enabled: boolean
  defaultCreditWhenMissingPaymentMethod: boolean
  createdAt: Date
  updatedAt: Date
}

const ArSettingsSchema = new Schema<ArSettingsDocument>(
  {
    companyId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    defaultCreditWhenMissingPaymentMethod: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const ArSettingsMongoModel: Model<ArSettingsDocument> =
  mongoose.models.ArSettings ?? mongoose.model<ArSettingsDocument>('ArSettings', ArSettingsSchema)
