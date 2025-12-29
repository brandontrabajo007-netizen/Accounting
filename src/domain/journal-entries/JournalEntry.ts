import type { EventType } from '../events/EventType.enum'
import type { Movement } from '../movements/Movement'
import type { JournalEntryStatus } from './JournalEntryStatus'

export type JournalEntry = {
  id: string
  companyId: string
  periodId?: string
  journalNumber?: number
  date: Date
  description: string
  status: JournalEntryStatus
  movements: Movement[]
  eventType?: EventType
  systemGenerated?: boolean
}
