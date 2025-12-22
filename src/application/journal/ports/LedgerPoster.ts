import type { JournalEntry } from '@domain/journal-entries/JournalEntry'

export interface LedgerPoster {
  /**
   * Postea un asiento contra las cuentas, aplicando deltas entre el estado previo y el nuevo.
   * Si previousEntry es null, se asume que no había efecto previo (alta nueva).
   */
  post(entry: JournalEntry, previousEntry?: JournalEntry | null): Promise<void>
}
