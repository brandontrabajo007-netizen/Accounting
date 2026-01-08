import type { PeriodAccessGuard } from '@application/accounting-periods/services/PeriodAccessGuard'
import type { ResolvePeriodId } from '@application/accounting-periods/services/resolvePeriodId'
import { EventType } from '@domain/events/EventType.enum'
import type { CustomerPaymentEvent } from '@domain/events/customer-payment/CustomerPaymentEvent'
import { generateCustomerPaymentJournalEntry } from '@domain/events/customer-payment/generateCustomerPaymentJournalEntry'
import { validateCustomerPaymentAccount } from '@domain/events/customer-payment/validateCustomerPaymentAccount'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import type { CustomerPaymentEventInput } from '../data/CustomerPaymentEventInput'
import type { CustomerPaymentAccountMappingRepository } from '../ports/CustomerPaymentAccountMappingRepository'
import { presentJournalEntry } from '@application/eventos/sales/presenters/presentJournalEntry'

export interface MakeRegisterCustomerPaymentDeps {
  accountRepository: AccountRepository
  customerPaymentAccountMappingRepository: CustomerPaymentAccountMappingRepository
  journalEntryRepository: JournalEntryRepository
  processJournalEntry: { process: (id: string) => Promise<JournalEntry> }
  periodAccessGuard: PeriodAccessGuard
  resolvePeriodId: ResolvePeriodId
  accountsReceivable?: {
    registerCustomerPaymentIfNeeded: (input: {
      companyId: string
      customerName?: string | null
      amount: number
      date?: Date
      journalEntryId?: string
      description?: string
      paymentMethod?: string | null
    }) => Promise<unknown>
  }
  customerHistory?: {
    registerPaymentHistory: (input: {
      companyId: string
      customerName: string
      amount: number
      date?: Date
      description?: string
      paymentMethod?: string | null
      journalEntryId?: string
    }) => Promise<unknown>
  }
}

export const makeRegisterCustomerPayment = ({
  accountRepository,
  customerPaymentAccountMappingRepository,
  journalEntryRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
  accountsReceivable,
  customerHistory,
}: MakeRegisterCustomerPaymentDeps) => {
  const registerCustomerPayment = async (input: CustomerPaymentEventInput) => {
    const date = (() => {
      if (input.date) {
        const d = new Date(input.date)
        if (!Number.isNaN(d.getTime())) return d
      }
      if (input.periodHint) {
        const [year, month] = input.periodHint.split('-').map((v) => Number(v))
        if (year && month && month >= 1 && month <= 12) {
          return new Date(Date.UTC(year, month - 1, 1))
        }
      }
      return new Date()
    })()

    const amount = Number.isFinite(input.amount) ? input.amount : 0
    const description =
      input.description && input.description.trim()
        ? input.description.trim()
        : input.customerName
          ? `Pago de ${input.customerName}`
          : 'Pago de cliente'

    const periodId = await resolvePeriodId.resolve(input.companyId, {
      periodId: input.periodId,
      date,
      periodHint: input.periodHint,
      reopenClosed: input.allowClosedReopen,
    })

    await periodAccessGuard.assertWritable(input.companyId, periodId)

    const accountsCatalog = await accountRepository.getAll()
    const accountMapping = await customerPaymentAccountMappingRepository.getCustomerPaymentAccountMappingByCompanyId(input.companyId)

    const paymentEvent: CustomerPaymentEvent = {
      type: EventType.CUSTOMER_PAYMENT,
      companyId: input.companyId,
      description,
      amount,
      date,
      paymentMethod: input.paymentMethod,
      toJournalEntry: (config) => generateCustomerPaymentJournalEntry(paymentEvent, config, accountsCatalog),
    }

    validateCustomerPaymentAccount(accountMapping, accountsCatalog)

    let journalEntry = generateCustomerPaymentJournalEntry(paymentEvent, accountMapping, accountsCatalog)
    journalEntry = { ...journalEntry, status: JournalEntryStatus.CREATED, eventType: EventType.CUSTOMER_PAYMENT, periodId }

    await journalEntryRepository.save(journalEntry)
    journalEntry = await processJournalEntry.process(journalEntry.id)

    if (accountsReceivable) {
      try {
        await accountsReceivable.registerCustomerPaymentIfNeeded({
          companyId: input.companyId,
          customerName: input.customerName ?? null,
          amount,
          date,
          journalEntryId: journalEntry.id,
          description,
          paymentMethod: input.paymentMethod ?? null,
        })
      } catch (error) {
        console.error('Error registrando AR (pago cliente):', error)
      }
    }

    if (customerHistory && input.customerName?.trim()) {
      try {
        await customerHistory.registerPaymentHistory({
          companyId: input.companyId,
          customerName: input.customerName,
          amount,
          date,
          description,
          paymentMethod: input.paymentMethod ?? null,
          journalEntryId: journalEntry.id,
        })
      } catch (error) {
        console.error('Error registrando historial cliente (pago):', error)
      }
    }

    return presentJournalEntry(journalEntry, accountsCatalog)
  }

  return { registerCustomerPayment }
}
