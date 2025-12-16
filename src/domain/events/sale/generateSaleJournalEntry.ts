// src/domain/journal-entries/helpers/generateSaleJournalEntry.ts

import { randomUUID } from 'node:crypto'
import type { SaleAccountConfig } from '@domain/events/sale/SaleAccountConfig'
import type { SaleEvent } from '@domain/events/sale/SaleEvent'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { Movement } from '@domain/movements/Movement'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'

const VAT_RATE = 0.19

import type { Account } from '@domain/accounts/Account'

export const generateSaleJournalEntry = (event: SaleEvent, accounts: SaleAccountConfig, accountsCatalog: Account[]): JournalEntry => {
  const getAccountName = (code: number): string => {
    const account = accountsCatalog.find((a) => a.code === code)
    if (!account) throw new Error(`Account with code ${code} not found in catalog`)
    return account.name
  }
  if (event.totalAmount <= 0) {
    throw new Error('Total amount must be greater than zero')
  }

  const movements: Movement[] = []

  // 1️ Entrada (caja / banco)
  movements.push({
    accountCode: accounts.cashAccount,
    accountName: getAccountName(accounts.cashAccount),
    type: TransactionTypes.DEBIT,
    amount: event.totalAmount,
    status: MovementStatus.CREATED,
    group: 'REVENUE',
  })

  // 2️ IVA — siempre se genera el movimiento
  let vat = 0
  let base = event.totalAmount
  const vatAccount = accounts.vatAccount

  if (!vatAccount && event.includesVAT) {
    throw new Error('VAT account not provided')
  }

  if (event.includesVAT) {
    base = Math.round(event.totalAmount / (1 + VAT_RATE))
    vat = event.totalAmount - base
  }

  movements.push({
    accountCode: vatAccount ?? 0,
    accountName: getAccountName(vatAccount ?? 0),
    type: TransactionTypes.CREDIT,
    amount: event.includesVAT ? vat : 0,
    status: MovementStatus.CREATED,
    group: 'REVENUE',
  })

  // 3️ Ingreso por ventas (siempre se genera)
  movements.push({
    accountCode: accounts.incomeAccount,
    accountName: getAccountName(accounts.incomeAccount),
    type: TransactionTypes.CREDIT,
    amount: base,
    status: MovementStatus.CREATED,
    group: 'REVENUE',
  })

  // 4️ Costo de venta (siempre se genera)
  let cost = 0
  if (!accounts.cogsAccount || !accounts.inventoryAccount) {
    if (event.includesCost) {
      throw new Error('Cost or inventory account not provided')
    }
  }

  if (event.includesCost) {
    if (!event.quantity || !event.unitCost) throw new Error('Quantity and unit cost must be provided')
    cost = event.quantity * event.unitCost
  }

  movements.push({
    accountCode: accounts.cogsAccount ?? 0,
    accountName: getAccountName(accounts.cogsAccount ?? 0),
    type: TransactionTypes.DEBIT,
    amount: event.includesCost ? cost : 0,
    status: MovementStatus.CREATED,
    group: 'COST',
  })

  movements.push({
    accountCode: accounts.inventoryAccount ?? 0,
    accountName: getAccountName(accounts.inventoryAccount ?? 0),
    type: TransactionTypes.CREDIT,
    amount: event.includesCost ? cost : 0,
    status: MovementStatus.CREATED,
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
