import type { PendingEvent, PendingEventStatus } from '../PendingEvent'

export interface PendingEventRepository {
  create(input: Omit<PendingEvent, 'id' | 'createdAt'> & { createdAt?: Date }): Promise<PendingEvent>
  findById(id: string): Promise<PendingEvent | null>
  findLatestPendingByTelegramUserId(telegramUserId: number, eventType?: PendingEvent['eventType']): Promise<PendingEvent | null>
  updateData(id: string, interpretedData: Record<string, unknown>, metadata?: Record<string, unknown> | null): Promise<PendingEvent | null>
  updateStatus(id: string, status: PendingEventStatus): Promise<PendingEvent | null>
  expirePastDue(now?: Date): Promise<number>
}
