import type { PeriodAccessGuard } from '@application/accounting-periods/services/PeriodAccessGuard'
import type { ResolvePeriodId } from '@application/accounting-periods/services/resolvePeriodId'
import { EventType } from '@domain/events/EventType.enum'
import type { SupplierPaymentEvent } from '@domain/events/supplier-payment/SupplierPaymentEvent'
import { generateSupplierPaymentJournalEntry } from '@domain/events/supplier-payment/generateSupplierPaymentJournalEntry'
import { validateSupplierPaymentAccount } from '@domain/events/supplier-payment/validateSupplierPaymentAccount'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import type { SupplierPaymentEventInput } from '../data/SupplierPaymentEventInput'
import type { SupplierPaymentAccountMappingRepository } from '../ports/SupplierPaymentAccountMappingRepository'
import { presentJournalEntry } from '@application/eventos/sales/presenters/presentJournalEntry'

export interface MakeRegisterSupplierPaymentDeps {
  accountRepository: AccountRepository
  supplierPaymentAccountMappingRepository: SupplierPaymentAccountMappingRepository
  journalEntryRepository: JournalEntryRepository
  processJournalEntry: { process: (id: string) => Promise<JournalEntry> }
  periodAccessGuard: PeriodAccessGuard
  resolvePeriodId: ResolvePeriodId
  accountsPayable?: {
    registerSupplierPaymentIfNeeded: (input: {
      companyId: string
      supplierName?: string | null
      amount: number
      date?: Date
      journalEntryId?: string
      description?: string
      paymentMethod?: string | null
    }) => Promise<unknown>
  }
  supplierHistory?: {
    registerPaymentHistory: (input: {
      companyId: string
      supplierName: string
      amount: number
      date?: Date
      description?: string
      paymentMethod?: string | null
      journalEntryId?: string
    }) => Promise<unknown>
  }
}

export const makeRegisterSupplierPayment = ({
  accountRepository,
  supplierPaymentAccountMappingRepository,
  journalEntryRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
  accountsPayable,
  supplierHistory,
}: MakeRegisterSupplierPaymentDeps) => {
  const registerSupplierPayment = async (input: SupplierPaymentEventInput) => {
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
        : input.supplierName
          ? `Pago a ${input.supplierName}`
          : 'Pago a proveedor'

    const periodId = await resolvePeriodId.resolve(input.companyId, {
      periodId: input.periodId,
      date,
      periodHint: input.periodHint,
      reopenClosed: input.allowClosedReopen,
    })

    await periodAccessGuard.assertWritable(input.companyId, periodId)

    const accountsCatalog = await accountRepository.getAll()
    const accountMapping = await supplierPaymentAccountMappingRepository.getSupplierPaymentAccountMappingByCompanyId(input.companyId)

    const paymentEvent: SupplierPaymentEvent = {
      type: EventType.SUPPLIER_PAYMENT,
      companyId: input.companyId,
      description,
      amount,
      date,
      paymentMethod: input.paymentMethod,
      toJournalEntry: (config) => generateSupplierPaymentJournalEntry(paymentEvent, config, accountsCatalog),
    }

    validateSupplierPaymentAccount(accountMapping, accountsCatalog)

    let journalEntry = generateSupplierPaymentJournalEntry(paymentEvent, accountMapping, accountsCatalog)
    journalEntry = { ...journalEntry, status: JournalEntryStatus.CREATED, eventType: EventType.SUPPLIER_PAYMENT, periodId }

    await journalEntryRepository.save(journalEntry)
    journalEntry = await processJournalEntry.process(journalEntry.id)

    if (accountsPayable) {
      try {
        await accountsPayable.registerSupplierPaymentIfNeeded({
          companyId: input.companyId,
          supplierName: input.supplierName ?? null,
          amount,
          date,
          journalEntryId: journalEntry.id,
          description,
          paymentMethod: input.paymentMethod ?? null,
        })
      } catch (error) {
        console.error('Error registrando AP (pago proveedor):', error)
      }
    }

    if (supplierHistory && input.supplierName?.trim()) {
      try {
        await supplierHistory.registerPaymentHistory({
          companyId: input.companyId,
          supplierName: input.supplierName,
          amount,
          date,
          description,
          paymentMethod: input.paymentMethod ?? null,
          journalEntryId: journalEntry.id,
        })
      } catch (error) {
        console.error('Error registrando historial proveedor (pago):', error)
      }
    }

    return presentJournalEntry(journalEntry, accountsCatalog)
  }

  return { registerSupplierPayment }
}
