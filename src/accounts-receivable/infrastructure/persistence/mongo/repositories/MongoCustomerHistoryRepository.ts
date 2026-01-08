import type { CustomerHistoryRepository } from '../../../../application/ports/CustomerHistoryRepository'
import type { CustomerHistoryEntry, CustomerHistoryType } from '../../../../domain/CustomerHistoryEntry'
import { CustomerHistoryMongoModel } from '../models/CustomerHistoryModel'

interface CustomerHistoryDocument {
  _id: { toString(): string }
  companyId: string
  customerId: string
  type: CustomerHistoryType
  amount: number
  date: Date
  description?: string
  paymentMethod?: string
  journalEntryId?: string
  createdAt: Date
}

const toDomain = (doc: CustomerHistoryDocument): CustomerHistoryEntry => ({
  id: doc._id.toString(),
  companyId: doc.companyId,
  customerId: doc.customerId,
  type: doc.type,
  amount: doc.amount,
  date: doc.date,
  description: doc.description,
  paymentMethod: doc.paymentMethod,
  journalEntryId: doc.journalEntryId,
  createdAt: doc.createdAt,
})

export class MongoCustomerHistoryRepository implements CustomerHistoryRepository {
  async add(entry: Omit<CustomerHistoryEntry, 'id' | 'createdAt'>): Promise<CustomerHistoryEntry> {
    const doc = await CustomerHistoryMongoModel.create(entry)
    return toDomain(doc)
  }

  async listByCustomer(
    companyId: string,
    customerId: string,
    params?: { from?: Date; to?: Date; page?: number; limit?: number; sort?: 'asc' | 'desc' },
  ): Promise<{ items: CustomerHistoryEntry[]; total: number }> {
    const page = params?.page && params.page > 0 ? params.page : 1
    const limit = params?.limit && params.limit > 0 ? params.limit : 100
    const skip = (page - 1) * limit
    const sortDir = params?.sort === 'desc' ? -1 : 1

    type DateRangeFilter = { $gte?: Date; $lte?: Date }
    const filter: { companyId: string; customerId: string; date?: DateRangeFilter } = { companyId, customerId }
    if (params?.from || params?.to) {
      filter.date = {} as DateRangeFilter
      if (params.from) filter.date.$gte = params.from
      if (params.to) filter.date.$lte = params.to
    }

    const [docs, total] = await Promise.all([
      CustomerHistoryMongoModel.find(filter).sort({ date: sortDir, createdAt: sortDir, _id: sortDir }).skip(skip).limit(limit).lean(),
      CustomerHistoryMongoModel.countDocuments(filter),
    ])

    return { items: docs.map(toDomain), total }
  }
}
