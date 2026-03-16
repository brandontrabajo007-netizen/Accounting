import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface ArCustomerDocument extends Document {
  companyId: string
  name: string
  normalizedName: string
  documentNumber?: string
  phone?: string
  city?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

const ArCustomerSchema = new Schema<ArCustomerDocument>(
  {
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    normalizedName: { type: String, required: true },
    documentNumber: { type: String },
    phone: { type: String },
    city: { type: String },
    address: { type: String },
  },
  { timestamps: true },
)

ArCustomerSchema.index({ companyId: 1, normalizedName: 1 }, { unique: true })

export const ArCustomerMongoModel: Model<ArCustomerDocument> =
  mongoose.models.ArCustomer ?? mongoose.model<ArCustomerDocument>('ArCustomer', ArCustomerSchema)
