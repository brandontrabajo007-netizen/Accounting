import { randomUUID } from 'node:crypto'
import type { Account } from '@domain/accounts/Account'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { Movement } from '@domain/movements/Movement'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'
import type { PurchaseAccountConfig } from './PurchaseAccountConfig'
import type { PurchaseEvent } from './PurchaseEvent'

const VAT_RATE = 0.19

const getAccountName = (catalog: Account[], code: number): string => catalog.find((a) => a.code === code)?.name ?? ''

export const generatePurchaseJournalEntry = (event: PurchaseEvent, config: PurchaseAccountConfig, accountsCatalog: Account[]): JournalEntry => {
  const movements: Movement[] = []

  let base = event.amount > 0 ? event.amount : 0
  let vat = 0

  if (event.includesVAT && config.vatAccount && base > 0) {
    base = Math.round(event.amount / (1 + VAT_RATE))
    vat = event.amount - base
  }

  movements.push({
    accountCode: event.debitAccount ?? 0,
    accountName: getAccountName(accountsCatalog, event.debitAccount ?? 0),
    type: TransactionTypes.DEBIT,
    amount: base,
    status: base > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
    group: 'MAIN',
  })

  if (config.vatAccount) {
    movements.push({
      accountCode: config.vatAccount,
      accountName: getAccountName(accountsCatalog, config.vatAccount),
      type: TransactionTypes.DEBIT,
      amount: vat,
      status: vat > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
      group: 'MAIN',
    })
  }

  let creditAccount: number | undefined

  if (event.paymentMethod === 'cash') creditAccount = config.cashAccount
  if (event.paymentMethod === 'bank') creditAccount = config.bankAccount
  if (event.paymentMethod === 'credit') creditAccount = config.accountsPayableAccount

  movements.push({
    accountCode: creditAccount ?? 0,
    accountName: getAccountName(accountsCatalog, creditAccount ?? 0),
    type: TransactionTypes.CREDIT,
    amount: event.amount ?? 0,
    status: event.amount > 0 && creditAccount ? MovementStatus.CREATED : MovementStatus.PENDING,
    group: 'MAIN',
  })

  return {
    id: randomUUID(),
    companyId: event.companyId,
    date: event.date,
    description: event.description,
    status: JournalEntryStatus.CREATED,
    movements,
  }
}
