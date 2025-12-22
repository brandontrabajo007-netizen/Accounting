// src/domain/events/payroll/generatePayrollJournalEntry.ts
import { randomUUID } from 'node:crypto'
import type { Account } from '@domain/accounts/Account'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { Movement } from '@domain/movements/Movement'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'
import type { PayrollAccountConfig } from './PayrollAccountConfig'
import type { PayrollEvent } from './PayrollEvent'

const getAccountName = (catalog: Account[], code?: number): string => {
  if (!code) return ''
  return catalog.find((a) => a.code === code)?.name ?? ''
}

export const generatePayrollJournalEntry = (event: PayrollEvent, config: PayrollAccountConfig, accountsCatalog: Account[]): JournalEntry => {
  const amount = event.amount > 0 ? event.amount : 0
  const creditAccountCode = event.paymentMethod === 'cash' ? config.cashAccount : config.bankAccount

  const movements: Movement[] = [
    {
      accountCode: config.expenseAccount ?? 0,
      accountName: getAccountName(accountsCatalog, config.expenseAccount),
      type: TransactionTypes.DEBIT,
      amount,
      status: amount > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
      group: 'MAIN',
    },
    {
      accountCode: creditAccountCode ?? 0,
      accountName: getAccountName(accountsCatalog, creditAccountCode),
      type: TransactionTypes.CREDIT,
      amount,
      status: amount > 0 && creditAccountCode ? MovementStatus.CREATED : MovementStatus.PENDING,
      group: 'MAIN',
    },
  ]

  return {
    id: randomUUID(),
    companyId: event.companyId,
    date: event.date,
    description: event.description,
    status: JournalEntryStatus.CREATED,
    movements,
  }
}
