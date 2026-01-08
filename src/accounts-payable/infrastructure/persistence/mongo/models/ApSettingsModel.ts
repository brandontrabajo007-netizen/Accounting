import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface ApSettingsDocument extends Document {
  companyId: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

const ApSettingsSchema = new Schema<ApSettingsDocument>(
  {
    companyId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const ApSettingsMongoModel: Model<ApSettingsDocument> =
  mongoose.models.ApSettings ?? mongoose.model<ApSettingsDocument>('ApSettings', ApSettingsSchema)
