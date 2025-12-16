import { randomUUID } from 'node:crypto'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { Movement } from '@domain/movements/Movement'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'
import type { PurchaseAccountConfig } from './PurchaseAccountConfig'
import type { PurchaseEvent } from './PurchaseEvent'

const VAT_RATE = 0.19

import type { Account } from '@domain/accounts/Account'

export const generatePurchaseJournalEntry = (event: PurchaseEvent, config: PurchaseAccountConfig, accountsCatalog: Account[]): JournalEntry => {
  const getAccountName = (code: number): string => {
    const account = accountsCatalog.find((a) => a.code === code)
    if (!account) throw new Error(`Account with code ${code} not found in catalog`)
    return account.name
  }

  const movements: Movement[] = []

  // ▶ Calcular base e IVA
  let base = event.amount
  let vat = 0

  if (event.includesVAT && config.vatAccount) {
    base = Math.round(event.amount / (1 + VAT_RATE))
    vat = event.amount - base
  }

  // ▶ 1. DEBE - Cuenta elegida por el usuario
  movements.push({
    accountCode: event.debitAccount,
    accountName: getAccountName(event.debitAccount),
    type: TransactionTypes.DEBIT,
    amount: base,
    status: MovementStatus.CREATED,
    group: 'MAIN',
  })

  // ▶ 2. DEBE - IVA descontable (opcional)
  if (vat > 0 && config.vatAccount) {
    movements.push({
      accountCode: config.vatAccount,
      accountName: getAccountName(config.vatAccount),
      type: TransactionTypes.DEBIT,
      amount: vat,
      status: MovementStatus.CREATED,
      group: 'MAIN',
    })
  }

  // ▶ 3. HABER - Método de pago
  const total = event.amount

  let creditAccount: number | undefined

  if (event.paymentMethod === 'cash') creditAccount = config.cashAccount
  if (event.paymentMethod === 'bank') creditAccount = config.bankAccount
  if (event.paymentMethod === 'credit') creditAccount = config.accountsPayableAccount

  if (!creditAccount) {
    throw new Error('Missing credit account for payment method')
  }

  movements.push({
    accountCode: creditAccount,
    accountName: getAccountName(creditAccount),
    type: TransactionTypes.CREDIT,
    amount: total,
    status: MovementStatus.CREATED,
    group: 'MAIN',
  })

  // ▶ Armar JournalEntry
  return {
    id: randomUUID(),
    companyId: event.companyId,
    date: event.date,
    description: event.description,
    status: JournalEntryStatus.CREATED,
    movements,
  }
}
