import type { PeriodResultRepository } from '@application/accounting-periods/ports/PeriodResultRepository'
import type { PeriodResult } from '@domain/accounting-periods/snapshots/PeriodResult'
import { PeriodResultModel } from '../models/periodResult.model'

const toDomain = (doc: any): PeriodResult => ({
  id: doc.id,
  companyId: doc.companyId,
  periodId: doc.periodId,
  period: {
    start: new Date(doc.period.start),
    end: new Date(doc.period.end),
  },
  incomeStatement: doc.incomeStatement,
  generatedAt: doc.generatedAt,
})

export const makeMongoPeriodResultRepository = (): PeriodResultRepository => ({
  save: async (snapshot) => {
    await PeriodResultModel.updateOne({ companyId: snapshot.companyId, periodId: snapshot.periodId }, { $set: snapshot }, { upsert: true })
  },
  findByPeriod: async (companyId, periodId) => {
    const doc = await PeriodResultModel.findOne({ companyId, periodId }).lean()
    return doc ? toDomain(doc) : null
  },
})
