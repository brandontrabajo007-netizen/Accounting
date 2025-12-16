import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import { MovementStatus } from '@domain/movements/MovementStatus'
import type { LedgerPoster } from '../ports/LedgerPoster'

export const makeProcessJournalEntry = (journalRepo: JournalEntryRepository, ledgerPoster: LedgerPoster) => {
  return {
    process: async (journalEntryId: string) => {
      const entry = await journalRepo.findById(journalEntryId)
      if (!entry) throw new Error('Journal entry not found')

      entry.status = JournalEntryStatus.PENDING
      await journalRepo.save(entry)

      await ledgerPoster.post(entry)

      const allProcessed = entry.movements.every((m) => m.status === MovementStatus.PROCESSED)
      entry.status = allProcessed ? JournalEntryStatus.PROCESSED : JournalEntryStatus.PENDING
      await journalRepo.save(entry)

      return entry
    },
  }
}
