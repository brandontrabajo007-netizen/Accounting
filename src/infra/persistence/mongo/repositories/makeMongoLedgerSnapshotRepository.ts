import type { LedgerSnapshotRepository } from '@application/accounting-periods/ports/LedgerSnapshotRepository'
import type { LedgerSnapshot } from '@domain/accounting-periods/snapshots/LedgerSnapshot'
import { LedgerSnapshotModel } from '../models/ledgerSnapshot.model'

const toDomain = (doc: any): LedgerSnapshot => ({
  id: doc.id,
  companyId: doc.companyId,
  periodId: doc.periodId,
  period: {
    start: new Date(doc.period.start),
    end: new Date(doc.period.end),
  },
  lines: doc.lines.map((l: any) => ({
    accountCode: l.accountCode,
    accountName: l.accountName,
    balance: l.balance,
  })),
  generatedAt: doc.generatedAt,
})

export const makeMongoLedgerSnapshotRepository = (): LedgerSnapshotRepository => ({
  save: async (snapshot) => {
    await LedgerSnapshotModel.updateOne(
      { companyId: snapshot.companyId, periodId: snapshot.periodId },
      { $set: snapshot },
      { upsert: true },
    )
  },
  findLatestByCompany: async (companyId) => {
    const doc = await LedgerSnapshotModel.findOne({ companyId }).sort({ 'period.end': -1 }).lean()
    return doc ? toDomain(doc) : null
  },
  findByPeriod: async (companyId, periodId) => {
    const doc = await LedgerSnapshotModel.findOne({ companyId, periodId }).lean()
    return doc ? toDomain(doc) : null
  },
})
