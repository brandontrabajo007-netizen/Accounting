// src/application/presenters/presentJournalEntry.ts

import type { Account } from '@domain/accounts/Account'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'

export const presentJournalEntry = (journalEntry: JournalEntry, accountsCatalog: Account[]) => {
  return {
    ...journalEntry,
    movements: journalEntry.movements.map((mov) => {
      const account = accountsCatalog.find((acc) => acc.code === mov.accountCode)

      return {
        ...mov,
        accountName: account?.name ?? 'Unknown',
        accountType: account?.type ?? 'Unknown',
      }
    }),
  }
}
