import type { ApSupplierBalance, ApEntryRepository } from '../../../../application/ports/ApEntryRepository'
import type { ApEntry, ApEntrySource, ApEntryType } from '../../../../domain/ApEntry'
import { ApEntryMongoModel } from '../models/ApEntryModel'

interface ApEntryDocument {
  _id: { toString(): string }
  companyId: string
  supplierId: string
  type: ApEntryType
  amount: number
  date: Date
  source: ApEntrySource
  createdAt: Date
}

const toDomain = (doc: ApEntryDocument): ApEntry => ({
  id: doc._id.toString(),
  companyId: doc.companyId,
  supplierId: doc.supplierId,
  type: doc.type,
  amount: doc.amount,
  date: doc.date,
  source: doc.source,
  createdAt: doc.createdAt,
})

export class MongoApEntryRepository implements ApEntryRepository {
  async add(entry: Omit<ApEntry, 'id' | 'createdAt'>): Promise<ApEntry> {
    const doc = await ApEntryMongoModel.create(entry)
    return toDomain(doc)
  }

  async listBySupplier(companyId: string, supplierId: string): Promise<ApEntry[]> {
    const docs = await ApEntryMongoModel.find({ companyId, supplierId }).sort({ date: 1, createdAt: 1, _id: 1 }).lean()
    return docs.map(toDomain)
  }

  async listBalancesByCompany(companyId: string): Promise<ApSupplierBalance[]> {
    const rows = await ApEntryMongoModel.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: '$supplierId',
          balance: {
            $sum: {
              $cond: [{ $eq: ['$type', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }],
            },
          },
        },
      },
    ])

    return rows.map((row: { _id: string; balance: number }) => ({
      supplierId: String(row._id),
      balance: row.balance ?? 0,
    }))
  }

  async getBalanceBySupplier(companyId: string, supplierId: string): Promise<number> {
    const [row] = await ApEntryMongoModel.aggregate([
      { $match: { companyId, supplierId } },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [{ $eq: ['$type', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }],
            },
          },
        },
      },
    ])

    return row?.balance ?? 0
  }
}
