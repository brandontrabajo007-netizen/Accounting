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
