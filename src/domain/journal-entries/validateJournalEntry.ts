import { TransactionTypes } from '../movements/TransactionType'
import type { JournalEntry } from './JournalEntry'

export const validateJournalEntry = (entry: JournalEntry): void => {
  const totalDebits = entry.movements.filter((m) => m.type === TransactionTypes.DEBIT).reduce((sum, m) => sum + m.amount, 0)

  const totalCredits = entry.movements.filter((m) => m.type === TransactionTypes.CREDIT).reduce((sum, m) => sum + m.amount, 0)

  if (totalDebits !== totalCredits) {
    throw new Error(`Journal entry is unbalanced: debits=${totalDebits}, credits=${totalCredits}`)
  }
}
