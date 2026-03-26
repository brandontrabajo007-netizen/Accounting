export type PendingEventStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED'

export type PendingEventType =
  | 'sale'
  | 'sale_guided'
  | 'invoice_signature'
  | 'invoice_issuer_guided'
  | 'purchase'
  | 'payroll'
  | 'customer_payment'
  | 'supplier_payment'
  | 'customer_guided'

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
