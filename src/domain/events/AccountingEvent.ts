// src/domain/events/AccountingEvent.ts
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import type { EventType } from './EventType.enum'

export interface AccountingEvent<TConfig = unknown> {
  type: EventType
  description: string
  amount: number
  date: Date
  toJournalEntry: (config: TConfig) => JournalEntry
}
