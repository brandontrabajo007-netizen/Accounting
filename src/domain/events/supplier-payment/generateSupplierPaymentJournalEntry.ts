import { randomUUID } from 'node:crypto'
import type { Account } from '@domain/accounts/Account'
import type { SupplierPaymentAccountConfig } from './SupplierPaymentAccountConfig'
import type { SupplierPaymentEvent } from './SupplierPaymentEvent'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { Movement } from '@domain/movements/Movement'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'

const getAccountName = (catalog: Account[], code: number): string => catalog.find((a) => a.code === code)?.name ?? ''

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

const chooseCashAccount = (paymentMethod: string | null | undefined, mapping: SupplierPaymentAccountConfig) => {
  if (mapping.cashAccount && !mapping.bankAccount) return mapping.cashAccount
  if (mapping.bankAccount && !mapping.cashAccount) return mapping.bankAccount

  const normalized = paymentMethod ? normalize(paymentMethod) : ''
  if (normalized && /(banco|transferencia|transfer|tarjeta)/.test(normalized)) {
    return mapping.bankAccount ?? mapping.cashAccount
  }

  return mapping.cashAccount ?? mapping.bankAccount
}

export const generateSupplierPaymentJournalEntry = (
  event: SupplierPaymentEvent,
  accounts: SupplierPaymentAccountConfig,
  accountsCatalog: Account[],
): JournalEntry => {
  const amount = event.amount > 0 ? event.amount : 0
  const cashAccount = chooseCashAccount(event.paymentMethod, accounts)

  if (!cashAccount) {
    throw new Error('No hay cuenta de caja o banco configurada para pagos a proveedores')
  }

  const movements: Movement[] = [
    {
      accountCode: accounts.accountsPayableAccount,
      accountName: getAccountName(accountsCatalog, accounts.accountsPayableAccount),
      type: TransactionTypes.DEBIT,
      amount,
      status: amount > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
      group: 'MAIN',
    },
    {
      accountCode: cashAccount,
      accountName: getAccountName(accountsCatalog, cashAccount),
      type: TransactionTypes.CREDIT,
      amount,
      status: amount > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
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
