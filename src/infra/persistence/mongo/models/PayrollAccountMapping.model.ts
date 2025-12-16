import { model, Schema } from 'mongoose'

export interface PayrollAccountMappingMongo {
  companyId: string

  // Debit siempre va a Gastos de personal (5190)
  expenseAccount: number

  // Créditos dependen del medio de pago
  cashAccount: number // pago en efectivo
  bankAccount: number // pago por banco
}

const PayrollAccountMappingSchema = new Schema<PayrollAccountMappingMongo>({
  companyId: { type: String, required: true, unique: true },
  expenseAccount: { type: Number, required: true },
  cashAccount: { type: Number, required: true },
  bankAccount: { type: Number, required: true },
})

export const PayrollAccountMappingModel = model('PayrollAccountMapping', PayrollAccountMappingSchema)
