import type { LedgerMovementRepository, LedgerMovementFilters, LedgerMovementList } from '@application/shared/ports/LedgerMovementRepository'
import type { LedgerMovement } from '@domain/ledger/LedgerMovement'
import { LedgerMovementMongoModel } from '../models/LedgerMovementModel'

const toDomain = (doc: any): LedgerMovement => ({
  id: doc._id.toString(),
  accountCode: doc.accountCode,
  debit: doc.debit,
  credit: doc.credit,
  date: doc.date,
  journalEntryId: doc.journalEntryId,
  description: doc.description,
  companyId: doc.companyId,
  status: doc.status,
  periodId: doc.periodId,
  createdAt: doc.createdAt,
})

const buildFilter = ({ companyId, accountCode, periodId, from, to }: LedgerMovementFilters) => {
  const filter: Record<string, unknown> = { companyId, accountCode }
  if (periodId) filter.periodId = periodId
  if (from || to) {
    filter.date = {}
    if (from) (filter.date as any).$gte = from
    if (to) (filter.date as any).$lte = to
  }
  return filter
}

const emptyTotals = { debit: 0, credit: 0 }

export class MongoLedgerMovementRepository implements LedgerMovementRepository {
  async findByAccount(params: LedgerMovementFilters & { page: number; limit: number }): Promise<LedgerMovementList> {
    const { page, limit } = params
    const skip = (page - 1) * limit
    const filter = buildFilter(params)

    const [docs, total, totalsAgg] = await Promise.all([
      LedgerMovementMongoModel.find(filter).sort({ date: 1, createdAt: 1, _id: 1 }).skip(skip).limit(limit).lean(),
      LedgerMovementMongoModel.countDocuments(filter),
      LedgerMovementMongoModel.aggregate([
        { $match: filter },
        { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
      ]),
    ])

    const totals = totalsAgg[0] ? { debit: totalsAgg[0].debit ?? 0, credit: totalsAgg[0].credit ?? 0 } : emptyTotals

    return {
      items: docs.map(toDomain),
      total,
      totals,
    }
  }

  async sumBefore(params: LedgerMovementFilters & { before: Date }): Promise<{ debit: number; credit: number }> {
    const { companyId, accountCode, periodId, before } = params
    const filter = buildFilter({ companyId, accountCode, periodId })
    filter.date = { $lt: before }

    const [agg] = await LedgerMovementMongoModel.aggregate([
      { $match: filter },
      { $group: { _id: null, debit: { $sum: '$debit' }, credit: { $sum: '$credit' } } },
    ])

    return agg ? { debit: agg.debit ?? 0, credit: agg.credit ?? 0 } : emptyTotals
  }
}
