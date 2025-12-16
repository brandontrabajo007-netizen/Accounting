import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import type { Ledger } from './Ledger'

export const buildLedger = (entries: JournalEntry[]): Ledger => {
  const ledger: Ledger = {}

  for (const entry of entries) {
    for (const movement of entry.movements) {
      const { accountCode, type, amount } = movement

      if (!ledger[accountCode]) {
        ledger[accountCode] = {
          accountCode,
          debit: 0,
          credit: 0,
        }
      }

      if (type === 'debit') {
        ledger[accountCode].debit += amount
      } else {
        ledger[accountCode].credit += amount
      }
    }
  }

  return ledger
}
