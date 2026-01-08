export type PendingEventStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'

export type PendingEventType = 'sale' | 'purchase' | 'payroll' | 'customer_payment' | 'supplier_payment'

export type PendingEvent = {
  id: string
  companyId: string
  telegramUserId: number
  eventType: PendingEventType
  interpretedData: Record<string, unknown>
  metadata?: Record<string, unknown> | null
  status: PendingEventStatus
  createdAt: Date
  expiresAt?: Date | null
}
