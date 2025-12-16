import type { LedgerBalanceRepository } from '@application/shared/ports/LedgerBalanceRepository'
import { LedgerBalanceMongoModel } from '../models/LedgerBalanceModel'

export class MongoLedgerBalanceRepository implements LedgerBalanceRepository {
  async get(companyId: string, accountCode: number): Promise<number> {
    const doc = await LedgerBalanceMongoModel.findOne({ companyId, accountCode })
    return doc ? doc.balance : 0
  }

  async update(companyId: string, accountCode: number, newBalance: number): Promise<void> {
    await LedgerBalanceMongoModel.findOneAndUpdate({ companyId, accountCode }, { balance: newBalance }, { upsert: true })
  }

  // ✔ NUEVO: obtener todos los saldos de una empresa
  async getAllByCompany(companyId: string) {
    const docs = await LedgerBalanceMongoModel.find({ companyId }).lean()

    return docs.map((d) => ({
      accountCode: d.accountCode,
      balance: d.balance,
    }))
  }
}
