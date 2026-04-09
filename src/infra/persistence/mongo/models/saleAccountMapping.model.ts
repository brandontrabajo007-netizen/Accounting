import { type InferSchemaType, model, Schema } from 'mongoose'

// 1️ Define primero el schema
const saleAccountMappingSchema = new Schema({
  companyId: { type: String, required: true, unique: true },
  cashAccount: { type: Number, required: true },
  bankAccount: { type: Number },
  incomeAccount: { type: Number, required: true },
  vatAccount: { type: Number },
  cogsAccount: { type: Number },
  inventoryAccount: { type: Number },
  accountsReceivableAccount: { type: Number },
})

// 2 Genera el tipo AUTOMÁTICAMENTE a partir del schema
export type SaleAccountMappingDocument = InferSchemaType<typeof saleAccountMappingSchema>

// 3️ Crea el modelo con ese tipo
export const SaleAccountMappingModel = model<SaleAccountMappingDocument>('SaleAccountMapping', saleAccountMappingSchema)
