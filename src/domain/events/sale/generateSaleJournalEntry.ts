// src/domain/events/sale/generateSaleJournalEntry.ts

import { randomUUID } from 'node:crypto'
import type { Account } from '@domain/accounts/Account'
import type { SaleAccountConfig } from '@domain/events/sale/SaleAccountConfig'
import type { SaleEvent } from '@domain/events/sale/SaleEvent'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { Movement } from '@domain/movements/Movement'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'

const VAT_RATE = 0.19

const getAccountName = (catalog: Account[], code: number): string => catalog.find((a) => a.code === code)?.name ?? ''

export const generateSaleJournalEntry = (event: SaleEvent, accounts: SaleAccountConfig, accountsCatalog: Account[]): JournalEntry => {
  const totalAmount = event.totalAmount > 0 ? event.totalAmount : 0
  const movements: Movement[] = []

  // Entrada (caja / banco)
  movements.push({
    accountCode: accounts.cashAccount,
    accountName: getAccountName(accountsCatalog, accounts.cashAccount),
    type: TransactionTypes.DEBIT,
    amount: totalAmount,
    status: totalAmount > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
    group: 'REVENUE',
  })

  // IVA
  let vat = 0
  let base = totalAmount
  const vatAccount = accounts.vatAccount

  if (event.includesVAT && totalAmount > 0) {
    base = Math.round(totalAmount / (1 + VAT_RATE))
    vat = totalAmount - base
  }

  const vatStatus = vat > 0 ? MovementStatus.PROCESSED : MovementStatus.PROCESSED

  movements.push({
    accountCode: vatAccount ?? 0,
    accountName: getAccountName(accountsCatalog, vatAccount ?? 0),
    type: TransactionTypes.CREDIT,
    amount: event.includesVAT ? vat : 0,
    status: vatStatus,
    group: 'REVENUE',
  })

  // Ingreso por ventas
  movements.push({
    accountCode: accounts.incomeAccount,
    accountName: getAccountName(accountsCatalog, accounts.incomeAccount),
    type: TransactionTypes.CREDIT,
    amount: base,
    status: base > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
    group: 'REVENUE',
  })

  // Costo de venta
  let cost = 0
  if (event.includesCost && event.quantity && event.unitCost) {
    cost = event.quantity * event.unitCost
  }

  movements.push({
    accountCode: accounts.cogsAccount ?? 0,
    accountName: getAccountName(accountsCatalog, accounts.cogsAccount ?? 0),
    type: TransactionTypes.DEBIT,
    amount: event.includesCost ? cost : 0,
    status: cost > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
    group: 'COST',
  })

  movements.push({
    accountCode: accounts.inventoryAccount ?? 0,
    accountName: getAccountName(accountsCatalog, accounts.inventoryAccount ?? 0),
    type: TransactionTypes.CREDIT,
    amount: event.includesCost ? cost : 0,
    status: cost > 0 ? MovementStatus.CREATED : MovementStatus.PENDING,
    group: 'COST',
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
