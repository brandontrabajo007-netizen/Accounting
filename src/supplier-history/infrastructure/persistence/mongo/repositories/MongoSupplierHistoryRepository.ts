import type { SupplierHistoryRepository } from '../../../../application/ports/SupplierHistoryRepository'
import type { SupplierHistoryEntry, SupplierHistoryType } from '../../../../domain/SupplierHistoryEntry'
import { SupplierHistoryMongoModel } from '../models/SupplierHistoryModel'

interface SupplierHistoryDocument {
  _id: { toString(): string }
  companyId: string
  supplierId: string
  type: SupplierHistoryType
  amount: number
  date: Date
  description?: string
  paymentMethod?: string
  journalEntryId?: string
  createdAt: Date
}

const toDomain = (doc: SupplierHistoryDocument): SupplierHistoryEntry => ({
  id: doc._id.toString(),
  companyId: doc.companyId,
  supplierId: doc.supplierId,
  type: doc.type,
  amount: doc.amount,
  date: doc.date,
  description: doc.description,
  paymentMethod: doc.paymentMethod,
  journalEntryId: doc.journalEntryId,
  createdAt: doc.createdAt,
})

export class MongoSupplierHistoryRepository implements SupplierHistoryRepository {
  async add(entry: Omit<SupplierHistoryEntry, 'id' | 'createdAt'>): Promise<SupplierHistoryEntry> {
    const doc = await SupplierHistoryMongoModel.create(entry)
    return toDomain(doc)
  }

  async listBySupplier(
    companyId: string,
    supplierId: string,
    params?: { from?: Date; to?: Date; page?: number; limit?: number; sort?: 'asc' | 'desc' },
  ): Promise<{ items: SupplierHistoryEntry[]; total: number }> {
    const page = params?.page && params.page > 0 ? params.page : 1
    const limit = params?.limit && params.limit > 0 ? params.limit : 100
    const skip = (page - 1) * limit
    const sortDir = params?.sort === 'desc' ? -1 : 1

    type DateRangeFilter = { $gte?: Date; $lte?: Date }
    const filter: { companyId: string; supplierId: string; date?: DateRangeFilter } = { companyId, supplierId }
    if (params?.from || params?.to) {
      filter.date = {} as DateRangeFilter
      if (params.from) filter.date.$gte = params.from
      if (params.to) filter.date.$lte = params.to
    }

    const [docs, total] = await Promise.all([
      SupplierHistoryMongoModel.find(filter).sort({ date: sortDir, createdAt: sortDir, _id: sortDir }).skip(skip).limit(limit).lean(),
      SupplierHistoryMongoModel.countDocuments(filter),
    ])

    return { items: docs.map(toDomain), total }
  }
}
