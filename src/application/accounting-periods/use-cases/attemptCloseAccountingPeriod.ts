import { ensurePeriodIsOpen } from '@domain/accounting-periods/PeriodMustBeOpenPolicy'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { AccountingPeriodRepository } from '../ports/AccountingPeriodRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'

type Dependencies = {
  accountingPeriodRepository: AccountingPeriodRepository
  journalEntryRepository: JournalEntryRepository
}

export const makeAttemptCloseAccountingPeriod = ({ accountingPeriodRepository, journalEntryRepository }: Dependencies) => ({
  execute: async (companyId: string, periodId: string) => {
    const period = await accountingPeriodRepository.findById(periodId)
    if (!period || period.companyId !== companyId) {
      throw new Error('Accounting period not found')
    }

    ensurePeriodIsOpen(period)

    const entries = await journalEntryRepository.findByPeriodId(companyId, periodId)
    const pendingEntries = entries.filter((e) => e.status !== JournalEntryStatus.PROCESSED)

    return {
      period,
      blockers: pendingEntries.map((e) => ({ id: e.id, status: e.status })),
    }
  },
})
