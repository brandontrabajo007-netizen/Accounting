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
}

export const makeRegisterPurchase = ({ accountRepository, purchaseAccountMappingRepository, journalEntryRepository, processJournalEntry }: MakeRegisterPurchaseDeps) => {
  const registerPurchase = async (input: PurchaseEventInput) => {
    const date = input.date ? new Date(input.date) : new Date()

    if (!input.companyId) throw new Error('Company ID is required')
    if (!input.description) throw new Error('Description is required')
    if (!input.amount) throw new Error('Amount is required')
    if (!input.debitAccount) throw new Error('Debit account is required')
    if (!input.paymentMethod) throw new Error('Payment method is required')

    const catalog = await accountRepository.getAll()
    const mapping = await purchaseAccountMappingRepository.getPurchaseAccountMappingByCompanyId(input.companyId)

    const purchaseEvent: PurchaseEvent = {
      type: EventType.PURCHASE,
      companyId: input.companyId,
      description: input.description,
      amount: input.amount,
      debitAccount: input.debitAccount,
      includesVAT: input.includesVAT ?? false,
      paymentMethod: input.paymentMethod,
      supplier: input.supplier || undefined,
      date,
      toJournalEntry: (config) => generatePurchaseJournalEntry(purchaseEvent, config, catalog),
    }

    validatePurchaseAccount(mapping, catalog, purchaseEvent)

    let journalEntry = generatePurchaseJournalEntry(purchaseEvent, mapping, catalog)

    await journalEntryRepository.save(journalEntry)

    journalEntry = await processJournalEntry.process(journalEntry.id)

    return presentJournalEntry(journalEntry, catalog)
  }

  return { registerPurchase }
}
