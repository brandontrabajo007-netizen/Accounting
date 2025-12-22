// src/application/sales/use-cases/registerSale.ts

import { EventType } from '@domain/events/EventType.enum'
import { generateSaleJournalEntry } from '@domain/events/sale/generateSaleJournalEntry'
import type { SaleEvent } from '@domain/events/sale/SaleEvent'
import { validateSaleAccount } from '@domain/events/sale/validateSaleAccount'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { AccountRepository } from '../../../shared/ports/AccountRepository'
import type { JournalEntryRepository } from '../../../shared/ports/JournalEntryRepository'
import type { SaleEventInput } from '../data/SaleEventInput'
import type { SaleAccountMappingRepository } from '../ports/SaleAccountMappingRepository'
import { presentJournalEntry } from '../presenters/presentJournalEntry'

export interface MakeRegisterSaleDeps {
  accountRepository: AccountRepository
  saleAccountMappingRepository: SaleAccountMappingRepository
  journalEntryRepository: JournalEntryRepository
  processJournalEntry: { process: (id: string) => Promise<JournalEntry> }
}

export const makeRegisterSale = ({ accountRepository, saleAccountMappingRepository, journalEntryRepository, processJournalEntry }: MakeRegisterSaleDeps) => {
  const registerSale = async (input: SaleEventInput) => {
    const date = input.date ? new Date(input.date) : new Date()
    const includesVAT = input.includesVAT ?? false
    const includesCost = input.includesCost ?? false

    // Completar faltantes
    let quantity = input.quantity ?? 0
    let unitPrice = input.unitPrice ?? null
    let totalAmount = input.totalAmount ?? null

    if (unitPrice != null && quantity > 0 && totalAmount == null) {
      totalAmount = quantity * unitPrice
    }
    if (totalAmount != null && quantity > 0 && unitPrice == null) {
      unitPrice = Math.round(totalAmount / quantity)
    }

    quantity = quantity > 0 ? quantity : 0
    unitPrice = unitPrice ?? 0
    totalAmount = totalAmount ?? 0

    const description = input.description && typeof input.description === 'string' ? input.description : 'Venta pendiente'

    const accountsCatalog = await accountRepository.getAll()
    const accountMapping = await saleAccountMappingRepository.getSaleAccountMappingByCompanyId(input.companyId)

    const saleEvent: SaleEvent = {
      type: EventType.SALE,
      companyId: input.companyId,
      description,
      totalAmount,
      amount: includesVAT && totalAmount > 0 ? Math.round(totalAmount / 1.19) : totalAmount,
      date,
      includesVAT,
      includesCost,
      quantity,
      unitCost: input.unitCost,
      unitPrice,
      toJournalEntry: (config) => generateSaleJournalEntry(saleEvent, config, accountsCatalog),
    }

    // Validar solo si hay cuentas; no lanzar por faltantes de costo
    validateSaleAccount(accountMapping, accountsCatalog, saleEvent)

    let journalEntry = generateSaleJournalEntry(saleEvent, accountMapping, accountsCatalog)
    journalEntry = { ...journalEntry, status: JournalEntryStatus.CREATED, eventType: EventType.SALE }

    await journalEntryRepository.save(journalEntry)
    journalEntry = await processJournalEntry.process(journalEntry.id)

    return presentJournalEntry(journalEntry, accountsCatalog)
  }

  return { registerSale }
}
