import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface ApSupplierDocument extends Document {
  companyId: string
  name: string
  normalizedName: string
  createdAt: Date
  updatedAt: Date
}

const ApSupplierSchema = new Schema<ApSupplierDocument>(
  {
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
  },
  { timestamps: true },
)

ApSupplierSchema.index({ companyId: 1, normalizedName: 1 }, { unique: true })

export const ApSupplierMongoModel: Model<ApSupplierDocument> =
  mongoose.models.ApSupplier ?? mongoose.model<ApSupplierDocument>('ApSupplier', ApSupplierSchema)
