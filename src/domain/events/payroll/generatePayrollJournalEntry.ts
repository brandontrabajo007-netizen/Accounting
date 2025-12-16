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

export const generatePayrollJournalEntry = (event: PayrollEvent, config: PayrollAccountConfig, accountsCatalog: Account[]): JournalEntry => {
  const getAccountName = (code: number): string => {
    const account = accountsCatalog.find((a) => a.code === code)
    if (!account) throw new Error(`Account with code ${code} not found in catalog`)
    return account.name
  }

  if (event.amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  const creditAccountCode = event.paymentMethod === 'cash' ? config.cashAccount : config.bankAccount

  const movements: Movement[] = [
    {
      accountCode: config.expenseAccount, // 5105
      accountName: getAccountName(config.expenseAccount),
      type: TransactionTypes.DEBIT,
      amount: event.amount,
      status: MovementStatus.CREATED,
      group: 'MAIN',
    },
    {
      accountCode: creditAccountCode,
      accountName: getAccountName(creditAccountCode),
      type: TransactionTypes.CREDIT,
      amount: event.amount,
      status: MovementStatus.CREATED,
      group: 'MAIN',
    },
  ]

  return {
    id: randomUUID(),
    companyId: event.companyId,
    date: event.date,
    description: event.description,
    status: JournalEntryStatus.CREATED, // igual que sales/purchase
    movements,
  }
}
