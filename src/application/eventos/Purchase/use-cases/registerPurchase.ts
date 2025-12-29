import type { PeriodAccessGuard } from '@application/accounting-periods/services/PeriodAccessGuard'
import type { ResolvePeriodId } from '@application/accounting-periods/services/resolvePeriodId'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import { EventType } from '@domain/events/EventType.enum'
import { generatePurchaseJournalEntry } from '@domain/events/purchase/generatePurchaseJournalEntry'
import type { PurchaseEvent } from '@domain/events/purchase/PurchaseEvent'
import { validatePurchaseAccount } from '@domain/events/purchase/validatePurchaseAccount'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'

import { presentJournalEntry } from '../../sales/presenters/presentJournalEntry'
import type { PurchaseEventInput } from '../data/PurchaseEventInput'
import type { PurchaseAccountMappingRepository } from '../ports/PurchaseAccountMappingRepository'

export interface MakeRegisterPurchaseDeps {
  accountRepository: AccountRepository
  purchaseAccountMappingRepository: PurchaseAccountMappingRepository
  journalEntryRepository: JournalEntryRepository
  processJournalEntry: { process: (id: string) => Promise<JournalEntry> }
  periodAccessGuard: PeriodAccessGuard
  resolvePeriodId: ResolvePeriodId
}

export const makeRegisterPurchase = ({
  accountRepository,
  purchaseAccountMappingRepository,
  journalEntryRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
}: MakeRegisterPurchaseDeps) => {
  const registerPurchase = async (input: PurchaseEventInput) => {
    const date = input.date ? new Date(input.date) : new Date()
    const companyId = input.companyId ?? ''
    if (!companyId) {
      throw new Error('companyId is required')
    }

    const periodId = await resolvePeriodId.resolve(companyId, input.periodId)

    await periodAccessGuard.assertWritable(companyId, periodId)

    const catalog = await accountRepository.getAll()
    const mapping = await purchaseAccountMappingRepository.getPurchaseAccountMappingByCompanyId(companyId)

    const purchaseEvent: PurchaseEvent = {
      type: EventType.PURCHASE,
      companyId,
      description: input.description ?? 'Compra pendiente',
      amount: input.amount ?? 0,
      debitAccount: input.debitAccount ?? 0,
      includesVAT: input.includesVAT ?? false,
      paymentMethod: input.paymentMethod ?? 'cash',
      supplier: input.supplier || undefined,
      date,
      toJournalEntry: (config) => generatePurchaseJournalEntry(purchaseEvent, config, catalog),
    }

    validatePurchaseAccount(mapping, catalog, purchaseEvent)

    let journalEntry = generatePurchaseJournalEntry(purchaseEvent, mapping, catalog)
    journalEntry = { ...journalEntry, eventType: EventType.PURCHASE, periodId }

    await journalEntryRepository.save(journalEntry)
    journalEntry = await processJournalEntry.process(journalEntry.id)

    return presentJournalEntry(journalEntry, catalog)
  }

  return { registerPurchase }
}
