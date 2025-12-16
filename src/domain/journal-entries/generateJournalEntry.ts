// src/domain/journal-entries/generateJournalEntry.ts

import type { BaseAccountMapping } from '@domain/accounts/BaseAccountMapping'
import type { AccountingEvent } from '@domain/events/AccountingEvent'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'

export const generateJournalEntry = <TConfig extends BaseAccountMapping>(
  event: AccountingEvent<TConfig>, // evento contable específico (venta, gasto…)
  accountMapping: TConfig, // mapeo correcto para ese evento
): JournalEntry => {
  return event.toJournalEntry(accountMapping) // delega al evento
}
