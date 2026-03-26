import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface InvoiceIssuerSettingsDocument extends Document {
  companyId: string
  companyName?: string
  taxId?: string
  contactPhone?: string
  address?: string
  createdAt: Date
  updatedAt: Date
}

const InvoiceIssuerSettingsSchema = new Schema<InvoiceIssuerSettingsDocument>(
  {
    companyId: { type: String, required: true, unique: true },
    companyName: { type: String },
    taxId: { type: String },
    contactPhone: { type: String },
    address: { type: String },
  },
  { timestamps: true },
)

export const InvoiceIssuerSettingsMongoModel: Model<InvoiceIssuerSettingsDocument> =
  mongoose.models.InvoiceIssuerSettings ?? mongoose.model<InvoiceIssuerSettingsDocument>('InvoiceIssuerSettings', InvoiceIssuerSettingsSchema)

