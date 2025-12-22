import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import { MovementStatus } from '@domain/movements/MovementStatus'
import type { LedgerPoster } from '../ports/LedgerPoster'

export const makeProcessJournalEntry = (journalRepo: JournalEntryRepository, ledgerPoster: LedgerPoster) => {
  const processEntry = async (entry: JournalEntry, previousEntry?: JournalEntry | null) => {
    entry.status = JournalEntryStatus.PENDING
    await journalRepo.save(entry)

    await ledgerPoster.post(entry, previousEntry ?? null)

    const allProcessed = entry.movements.every((m) => m.status === MovementStatus.PROCESSED)
    entry.status = allProcessed ? JournalEntryStatus.PROCESSED : JournalEntryStatus.PENDING
    await journalRepo.save(entry)

    return entry
  }

  return {
    process: async (journalEntryId: string, previousEntry?: JournalEntry | null) => {
      const entry = await journalRepo.findById(journalEntryId)
      if (!entry) throw new Error('Journal entry not found')
      return processEntry(entry, previousEntry)
    },
    processEntry,
  }
}
