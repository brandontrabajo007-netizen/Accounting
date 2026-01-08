import type { PendingEvent, PendingEventStatus } from '../PendingEvent'

export interface PendingEventRepository {
  create(input: Omit<PendingEvent, 'id' | 'createdAt'> & { createdAt?: Date }): Promise<PendingEvent>
  findById(id: string): Promise<PendingEvent | null>
  updateStatus(id: string, status: PendingEventStatus): Promise<PendingEvent | null>
  expirePastDue(now?: Date): Promise<number>
}
