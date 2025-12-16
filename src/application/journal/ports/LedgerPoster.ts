import type { JournalEntry } from '@domain/journal-entries/JournalEntry'

export interface LedgerPoster {
  post(entry: JournalEntry): Promise<void>
}
