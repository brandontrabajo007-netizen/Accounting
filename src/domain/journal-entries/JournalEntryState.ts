import type { JournalEntry } from './JournalEntry'
import { JournalEntryStatus } from './JournalEntryStatus'

export const markJournalEntryAsPending = (entry: JournalEntry): JournalEntry => ({
  ...entry,
  status: JournalEntryStatus.PENDING,
})

export const markJournalEntryAsProcessed = (entry: JournalEntry): JournalEntry => ({
  ...entry,
  status: JournalEntryStatus.PROCESSED,
})

export const resetJournalEntryToCreated = (entry: JournalEntry): JournalEntry => ({
  ...entry,
  status: JournalEntryStatus.CREATED,
})
