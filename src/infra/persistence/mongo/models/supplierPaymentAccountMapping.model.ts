import { type InferSchemaType, model, Schema } from 'mongoose'

const supplierPaymentAccountMappingSchema = new Schema({
  companyId: { type: String, required: true, unique: true },
  cashAccount: { type: Number },
  bankAccount: { type: Number },
  accountsPayableAccount: { type: Number, required: true },
})

export type SupplierPaymentAccountMappingDocument = InferSchemaType<typeof supplierPaymentAccountMappingSchema>

export const SupplierPaymentAccountMappingModel = model<SupplierPaymentAccountMappingDocument>(
  'SupplierPaymentAccountMapping',
  supplierPaymentAccountMappingSchema,
)
