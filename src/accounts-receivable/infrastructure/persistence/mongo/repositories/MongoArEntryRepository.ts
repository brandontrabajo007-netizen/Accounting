import type { ArCustomerBalance, ArEntryRepository } from '../../../../application/ports/ArEntryRepository'
import type { ArEntry, ArEntrySource, ArEntryType } from '../../../../domain/ArEntry'
import { ArEntryMongoModel } from '../models/ArEntryModel'

interface ArEntryDocument {
  _id: { toString(): string }
  companyId: string
  customerId: string
  type: ArEntryType
  amount: number
  date: Date
  source: ArEntrySource
  createdAt: Date
}

const toDomain = (doc: ArEntryDocument): ArEntry => ({
  id: doc._id.toString(),
  companyId: doc.companyId,
  customerId: doc.customerId,
  type: doc.type,
  amount: doc.amount,
  date: doc.date,
  source: doc.source,
  createdAt: doc.createdAt,
})

export class MongoArEntryRepository implements ArEntryRepository {
  async add(entry: Omit<ArEntry, 'id' | 'createdAt'>): Promise<ArEntry> {
    const doc = await ArEntryMongoModel.create(entry)
    return toDomain(doc)
  }

  async listByCustomer(companyId: string, customerId: string): Promise<ArEntry[]> {
    const docs = await ArEntryMongoModel.find({ companyId, customerId }).sort({ date: 1, createdAt: 1, _id: 1 }).lean()
    return docs.map(toDomain)
  }

  async listBalancesByCompany(companyId: string): Promise<ArCustomerBalance[]> {
    const rows = await ArEntryMongoModel.aggregate([
      { $match: { companyId } },
      {
        $group: {
          _id: '$customerId',
          balance: {
            $sum: {
              $cond: [{ $eq: ['$type', 'debit'] }, '$amount', { $multiply: ['$amount', -1] }],
            },
          },
        },
      },
    ])

    return rows.map((row: { _id: string; balance: number }) => ({
      customerId: String(row._id),
      balance: row.balance ?? 0,
    }))
  }

  async getBalanceByCustomer(companyId: string, customerId: string): Promise<number> {
    const [row] = await ArEntryMongoModel.aggregate([
      { $match: { companyId, customerId } },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [{ $eq: ['$type', 'debit'] }, '$amount', { $multiply: ['$amount', -1] }],
            },
          },
        },
      },
    ])

    return row?.balance ?? 0
  }

  async deleteByCustomer(companyId: string, customerId: string): Promise<number> {
    const result = await ArEntryMongoModel.deleteMany({ companyId, customerId })
    return result.deletedCount ?? 0
  }
}
