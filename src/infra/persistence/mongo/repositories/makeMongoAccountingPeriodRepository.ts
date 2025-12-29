import type { AccountingPeriodRepository } from '@application/accounting-periods/ports/AccountingPeriodRepository'
import type { AccountingPeriod } from '@domain/accounting-periods/AccountingPeriod'
import { AccountingPeriodStatus } from '@domain/accounting-periods/AccountingPeriodStatus'
import mongoose from 'mongoose'
import { AccountingPeriodModel } from '../models/accountingPeriod.model'

const toDomain = (doc: any): AccountingPeriod => ({
  id: doc._id.toString(),
  companyId: doc.companyId,
  name: doc.name,
  start: doc.start,
  end: doc.end,
  status: doc.status,
})

export const makeMongoAccountingPeriodRepository = (): AccountingPeriodRepository => ({
  findById: async (id) => {
    const objectId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
    const doc = await AccountingPeriodModel.findOne({ _id: objectId }).lean()
    return doc ? toDomain(doc) : null
  },
  findByDate: async (companyId, date) => {
    const doc = await AccountingPeriodModel.findOne({
      companyId,
      start: { $lte: date },
      end: { $gte: date },
    })
      .sort({ start: -1 })
      .lean()
    return doc ? toDomain(doc) : null
  },
  findOpenByCompany: async (companyId) => {
    const docs = await AccountingPeriodModel.find({ companyId, status: AccountingPeriodStatus.OPEN }).sort({ start: 1 }).lean()
    return docs.map(toDomain)
  },
  findByCompany: async (companyId) => {
    const docs = await AccountingPeriodModel.find({ companyId }).sort({ start: -1 }).lean()
    return docs.map(toDomain)
  },
  save: async (period) => {
    const _id = period.id && mongoose.Types.ObjectId.isValid(period.id) ? new mongoose.Types.ObjectId(period.id) : undefined
    if (_id) {
      await AccountingPeriodModel.updateOne({ _id }, { $set: { ...period } }, { upsert: true })
    } else {
      const doc = await AccountingPeriodModel.create({ ...period })
      period.id = doc._id.toString()
    }
  },
  markClosed: async (periodId) => {
    const objectId = mongoose.Types.ObjectId.isValid(periodId) ? new mongoose.Types.ObjectId(periodId) : periodId
    await AccountingPeriodModel.updateOne({ _id: objectId }, { $set: { status: AccountingPeriodStatus.CLOSED } })
  },
  markOpenExclusive: async (companyId, periodId) => {
    const objectId = mongoose.Types.ObjectId.isValid(periodId) ? new mongoose.Types.ObjectId(periodId) : periodId
    await AccountingPeriodModel.updateMany({ companyId, status: AccountingPeriodStatus.OPEN, _id: { $ne: objectId } }, { $set: { status: AccountingPeriodStatus.CLOSED } })
    await AccountingPeriodModel.updateOne({ _id: objectId }, { $set: { status: AccountingPeriodStatus.OPEN } })
  },
  lockById: async (periodId) => {
    const objectId = mongoose.Types.ObjectId.isValid(periodId) ? new mongoose.Types.ObjectId(periodId) : periodId
    const doc = await AccountingPeriodModel.findOne({ _id: objectId }).lean()
    return doc ? toDomain(doc) : null
  },
})
