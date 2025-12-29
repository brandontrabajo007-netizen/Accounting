import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import type { PaginatedResult } from '@application/shared/ports/PaginatedResult'
import type { EventType } from '@domain/events/EventType.enum'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import type { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { FilterQuery } from 'mongoose'
import { journalEntryToMongo, mongoToJournalEntry } from '../mappers/journalEntry.mapper'
import type { JournalEntryDocument } from '../models/journalEntry.model'
import { JournalEntryModel } from '../models/journalEntry.model'

export class MongoJournalEntryRepository implements JournalEntryRepository {
  async save(entry: JournalEntry): Promise<void> {
    await JournalEntryModel.updateOne({ id: entry.id }, { $set: journalEntryToMongo(entry) }, { upsert: true })
  }

  async findById(id: string): Promise<JournalEntry | null> {
    const doc = await JournalEntryModel.findOne({ id }).select('-_id -__v').lean<JournalEntryDocument>()
    return doc ? mongoToJournalEntry(doc) : null
  }

  async findByCompanyAndPeriod(companyId: string, start: Date, end: Date): Promise<JournalEntry[]> {
    const docs = await JournalEntryModel.find({
      companyId,
      date: { $gte: start, $lte: end },
    })
      .select('-_id -__v')
      .sort({ date: 1 })
      .lean<JournalEntryDocument[]>()

    return docs.map(mongoToJournalEntry)
  }

  async findByPeriodId(companyId: string, periodId: string): Promise<JournalEntry[]> {
    const docs = await JournalEntryModel.find({
      companyId,
      periodId,
    })
      .select('-_id -__v')
      .sort({ date: 1 })
      .lean<JournalEntryDocument[]>()

    return docs.map(mongoToJournalEntry)
  }

  async findByStatus(companyId: string, status: JournalEntryStatus): Promise<JournalEntry[]> {
    const docs = await JournalEntryModel.find({ companyId, status }).select('-_id -__v').sort({ date: -1 }).lean<JournalEntryDocument[]>()

    return docs.map(mongoToJournalEntry)
  }

  async deleteAllByCompany(companyId: string): Promise<void> {
    await JournalEntryModel.deleteMany({ companyId })
  }

  /* ---------------------------------------------------
     🔥 MÉTODO CLAVE: PAGINADO + FILTROS
  --------------------------------------------------- */
  async findPaginated(params: {
    companyId: string
    page: number
    limit: number
    search?: string
    status?: JournalEntryStatus
    from?: Date
    to?: Date
    eventType?: EventType
  }): Promise<PaginatedResult<JournalEntry>> {
    const { companyId, page, limit, search, status, from, to, eventType } = params

    const query: FilterQuery<JournalEntryDocument> = {
      companyId,
    }

    // 🔍 Texto (description o id)
    if (search) {
      query.$or = [{ description: { $regex: search, $options: 'i' } }, { id: { $regex: search, $options: 'i' } }]
    }

    // 🏷 Estado
    if (status) {
      query.status = status
    }

    // Evento
    if (eventType) {
      query.eventType = eventType
    }

    // 📅 Rango de fechas
    if (from || to) {
      query.date = {}
      if (from) query.date.$gte = from
      if (to) query.date.$lte = to
    }

    const result = await JournalEntryModel.paginate(query, {
      page,
      limit,
      sort: { date: -1 },
      lean: true,
      select: '-_id -__v',
    })

    return {
      docs: result.docs.map(mongoToJournalEntry),
      totalDocs: result.totalDocs,
      limit: result.limit,
      page: result.page ?? page,
      totalPages: result.totalPages,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    }
  }
}
