import { randomUUID } from 'node:crypto'
import { ensurePeriodIsOpen } from '@domain/accounting-periods/PeriodMustBeOpenPolicy'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import type { AccountingPeriodRepository } from '../ports/AccountingPeriodRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import type { PeriodResultRepository } from '../ports/PeriodResultRepository'
import type { DomainEventBus } from '../ports/DomainEventBus'
import type { TransactionRunner } from '../ports/TransactionRunner'
import type { AccountingPeriodClosed } from '@domain/accounting-periods/events/AccountingPeriodClosed'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import { calculateIncomeStatementFromEntries } from '@application/reports/services/calculateIncomeStatementFromEntries'

type Dependencies = {
  accountingPeriodRepository: AccountingPeriodRepository
  journalEntryRepository: JournalEntryRepository
  periodResultRepository: PeriodResultRepository
  domainEventBus: DomainEventBus
  transactionRunner: TransactionRunner
  accountRepository: AccountRepository
}

export const makeCloseAccountingPeriod = ({
  accountingPeriodRepository,
  journalEntryRepository,
  periodResultRepository,
  domainEventBus,
  transactionRunner,
  accountRepository,
}: Dependencies) => ({
  execute: async (companyId: string, periodId: string) =>
    transactionRunner.runInTransaction(async () => {
      const period = await accountingPeriodRepository.lockById(periodId)
      if (!period || period.companyId !== companyId) {
        throw new Error('Accounting period not found')
      }

      ensurePeriodIsOpen(period)

      const entries = await journalEntryRepository.findByPeriodId(companyId, periodId)
      const pending = entries.filter((e) => e.status !== JournalEntryStatus.PROCESSED)
      if (pending.length > 0) {
        throw new Error('Cannot close period with pending journal entries')
      }

      const accounts = await accountRepository.getAll()
      const incomeStatement = calculateIncomeStatementFromEntries({
        companyId,
        period: {
          start: period.start.toISOString(),
          end: period.end.toISOString(),
        },
        entries,
        accounts,
      })

      const existingResult = await periodResultRepository.findByPeriod(companyId, periodId)

      await periodResultRepository.save({
        id: existingResult?.id ?? randomUUID(),
        companyId,
        periodId,
        period: { start: period.start, end: period.end },
        incomeStatement,
        generatedAt: new Date(),
      })

      await accountingPeriodRepository.markClosed(periodId)

      const event: AccountingPeriodClosed = {
        type: 'accounting.period.closed',
        payload: { companyId, periodId },
      }
      await domainEventBus.publish(event)
    }),
})
