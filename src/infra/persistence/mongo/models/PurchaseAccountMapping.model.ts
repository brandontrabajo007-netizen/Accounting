import { type InferSchemaType, model, Schema } from 'mongoose'

const purchaseAccountMappingSchema = new Schema(
  {
    companyId: { type: String, required: true, unique: true },
    vatAccount: { type: Number },
    cashAccount: { type: Number },
    bankAccount: { type: Number },
    accountsPayableAccount: { type: Number, required: true },
  },
  { timestamps: true },
)

export type PurchaseAccountMappingDocument = InferSchemaType<typeof purchaseAccountMappingSchema>
export const PurchaseAccountMappingModel = model<PurchaseAccountMappingDocument>('PurchaseAccountMapping', purchaseAccountMappingSchema)
