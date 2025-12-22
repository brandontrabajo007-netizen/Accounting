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
}

export const makeRegisterPayroll = ({ accountRepository, payrollAccountMappingRepository, journalEntryRepository, processJournalEntry }: MakeRegisterPayrollDeps) => {
  const registerPayroll = async (input: PayrollEventInput) => {
    const date = input.date ? new Date(input.date) : new Date()

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

    let journalEntry = generatePayrollJournalEntry(payrollEvent, mapping, catalog)
    journalEntry = { ...journalEntry, eventType: EventType.PAYROLL }

    await journalEntryRepository.save(journalEntry)

    journalEntry = await processJournalEntry.process(journalEntry.id)

    return presentJournalEntry(journalEntry, catalog)
  }

  return { registerPayroll }
}
