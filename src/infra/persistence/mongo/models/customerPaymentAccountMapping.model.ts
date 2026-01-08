import { type InferSchemaType, model, Schema } from 'mongoose'

const customerPaymentAccountMappingSchema = new Schema({
  companyId: { type: String, required: true, unique: true },
  cashAccount: { type: Number },
  bankAccount: { type: Number },
  accountsReceivableAccount: { type: Number, required: true },
})

export type CustomerPaymentAccountMappingDocument = InferSchemaType<typeof customerPaymentAccountMappingSchema>

export const CustomerPaymentAccountMappingModel = model<CustomerPaymentAccountMappingDocument>(
  'CustomerPaymentAccountMapping',
  customerPaymentAccountMappingSchema,
)
