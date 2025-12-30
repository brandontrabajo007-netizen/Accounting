import type { PeriodAccessGuard } from '@application/accounting-periods/services/PeriodAccessGuard'
import type { ResolvePeriodId } from '@application/accounting-periods/services/resolvePeriodId'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'


import { EventType } from '@domain/events/EventType.enum'
import { generatePayrollJournalEntry } from '@domain/events/payroll/generatePayrollJournalEntry'
import type { PayrollEvent } from '@domain/events/payroll/PayrollEvent'
import { validatePayrollAccount } from '@domain/events/payroll/validatePayrollAccount'

import type { JournalEntry } from '@domain/journal-entries/JournalEntry'

import { presentJournalEntry } from '../../sales/presenters/presentJournalEntry'
import type { PayrollEventInput } from '../data/PayrollEventInput'
import type { PayrollAccountMappingRepository } from '../ports/PayrollAccountMappingRepository'

export interface MakeRegisterPayrollDeps {
  accountRepository: AccountRepository
  payrollAccountMappingRepository: PayrollAccountMappingRepository
  journalEntryRepository: JournalEntryRepository
  processJournalEntry: { process: (id: string) => Promise<JournalEntry> }
  periodAccessGuard: PeriodAccessGuard
  resolvePeriodId: ResolvePeriodId
}

export const makeRegisterPayroll = ({
  accountRepository,
  payrollAccountMappingRepository,
  journalEntryRepository,
  processJournalEntry,
  periodAccessGuard,
  resolvePeriodId,
}: MakeRegisterPayrollDeps) => {
  const registerPayroll = async (input: PayrollEventInput) => {
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
    if (!input.companyId) {
      throw new Error('companyId is required')
    }

    const periodId = await resolvePeriodId.resolve(input.companyId, {
      periodId: input.periodId,
      date,
      periodHint: input.periodHint,
      reopenClosed: input.allowClosedReopen,
    })

    const catalog = await accountRepository.getAll()

    const mapping = await payrollAccountMappingRepository.getPayrollAccountMappingByCompanyId(input.companyId)

    const payrollEvent: PayrollEvent = {
      type: EventType.PAYROLL,
      companyId: input.companyId,
      description: input.description || 'Nómina pendiente',
      amount: input.amount ?? 0,
      paymentMethod: input.paymentMethod,
      beneficiary: input.beneficiary,
      date,
      toJournalEntry: (config) => generatePayrollJournalEntry(payrollEvent, config, catalog),
    }

    validatePayrollAccount(mapping, catalog, payrollEvent)

    await periodAccessGuard.assertWritable(input.companyId, periodId)

    let journalEntry = generatePayrollJournalEntry(payrollEvent, mapping, catalog)
    journalEntry = { ...journalEntry, eventType: EventType.PAYROLL, periodId }

    await journalEntryRepository.save(journalEntry)

    journalEntry = await processJournalEntry.process(journalEntry.id)

    return presentJournalEntry(journalEntry, catalog)
  }

  return { registerPayroll }
}
