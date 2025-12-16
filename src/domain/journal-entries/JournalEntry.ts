import type { Movement } from '../movements/Movement'
import type { JournalEntryStatus } from './JournalEntryStatus'

export type JournalEntry = {
  id: string
  companyId: string
  journalNumber?: number
  date: Date
  description: string
  status: JournalEntryStatus
  movements: Movement[]
}
