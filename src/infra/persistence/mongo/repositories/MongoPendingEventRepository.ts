import type { PendingEvent, PendingEventStatus } from '@application/pending-events/PendingEvent'
import type { PendingEventRepository } from '@application/pending-events/ports/PendingEventRepository'
import { PendingEventMongoModel } from '../models/pendingEvent.model'

interface PendingEventDocument {
  _id: { toString(): string }
  companyId: string
  telegramUserId: number
  eventType: string
  interpretedData: Record<string, unknown>
  metadata?: Record<string, unknown> | null
  status: PendingEventStatus
  createdAt: Date
  expiresAt?: Date | null
}

const toDomain = (doc: PendingEventDocument): PendingEvent => ({
  id: doc._id.toString(),
  companyId: doc.companyId,
  telegramUserId: doc.telegramUserId,
  eventType: doc.eventType as PendingEvent['eventType'],
  interpretedData: doc.interpretedData ?? {},
  metadata: doc.metadata ?? null,
  status: doc.status,
  createdAt: doc.createdAt,
  expiresAt: doc.expiresAt ?? null,
})

export class MongoPendingEventRepository implements PendingEventRepository {
  async create(input: Omit<PendingEvent, 'id' | 'createdAt'> & { createdAt?: Date }): Promise<PendingEvent> {
    const doc = await PendingEventMongoModel.create({
      companyId: input.companyId,
      telegramUserId: input.telegramUserId,
      eventType: input.eventType,
      interpretedData: input.interpretedData,
      metadata: input.metadata ?? null,
      status: input.status,
      expiresAt: input.expiresAt ?? null,
      createdAt: input.createdAt ?? new Date(),
    })

    return toDomain(doc)
  }

  async findById(id: string): Promise<PendingEvent | null> {
    const doc = await PendingEventMongoModel.findById(id).lean()
    return doc ? toDomain(doc as PendingEventDocument) : null
  }

  async listByCompany(params: {
    companyId: string
    eventType?: PendingEvent['eventType']
    statuses?: PendingEventStatus[]
    from?: Date
    to?: Date
    page: number
    limit: number
  }): Promise<{ items: PendingEvent[]; total: number }> {
    const page = Number.isFinite(params.page) && params.page > 0 ? Math.floor(params.page) : 1
    const limit = Number.isFinite(params.limit) && params.limit > 0 ? Math.floor(params.limit) : 100
    const skip = (page - 1) * limit

    const query: Record<string, unknown> = { companyId: params.companyId }
    if (params.eventType) query.eventType = params.eventType
    if (params.statuses && params.statuses.length > 0) {
      query.status = { $in: params.statuses }
    }
    if (params.from || params.to) {
      const createdAt: { $gte?: Date; $lte?: Date } = {}
      if (params.from) createdAt.$gte = params.from
      if (params.to) createdAt.$lte = params.to
      query.createdAt = createdAt
    }

    const [docs, total] = await Promise.all([
      PendingEventMongoModel.find(query).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      PendingEventMongoModel.countDocuments(query),
    ])

    return {
      items: docs.map((doc) => toDomain(doc as PendingEventDocument)),
      total,
    }
  }

  async findLatestPendingByTelegramUserId(
    telegramUserId: number,
    eventType?: PendingEvent['eventType'],
  ): Promise<PendingEvent | null> {
    const query: Record<string, unknown> = {
      telegramUserId,
      status: 'PENDING_CONFIRMATION',
    }

    if (eventType) {
      query.eventType = eventType
    }

    const doc = await PendingEventMongoModel.findOne(query).sort({ createdAt: -1 }).lean()
    return doc ? toDomain(doc as PendingEventDocument) : null
  }

  async updateData(
    id: string,
    interpretedData: Record<string, unknown>,
    metadata?: Record<string, unknown> | null,
  ): Promise<PendingEvent | null> {
    const doc = await PendingEventMongoModel.findByIdAndUpdate(
      id,
      {
        interpretedData,
        metadata: metadata ?? null,
      },
      { new: true },
    ).lean()
    return doc ? toDomain(doc as PendingEventDocument) : null
  }

  async updateStatus(id: string, status: PendingEventStatus): Promise<PendingEvent | null> {
    const doc = await PendingEventMongoModel.findByIdAndUpdate(id, { status }, { new: true }).lean()
    return doc ? toDomain(doc as PendingEventDocument) : null
  }

  async expirePastDue(now: Date = new Date()): Promise<number> {
    const result = await PendingEventMongoModel.updateMany(
      {
        status: 'PENDING_CONFIRMATION',
        expiresAt: { $ne: null, $lt: now },
      },
      { status: 'EXPIRED' },
    )
    return result.modifiedCount ?? 0
  }
}
