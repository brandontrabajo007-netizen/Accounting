import { randomUUID } from 'node:crypto'
import type { IncomeStatementSnapshot } from '@application/reports/types/IncomeStatementSnapshot'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { IncomeStatementRepository } from '@application/shared/ports/IncomeStatementRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import { calculateIncomeStatementFromEntries } from '../services/calculateIncomeStatementFromEntries'

export const makeGenerateAndSaveIncomeStatement = ({
  accountRepository,
  incomeStatementRepository,
  journalEntryRepository,
}: {
  accountRepository: AccountRepository
  incomeStatementRepository: IncomeStatementRepository
  journalEntryRepository: JournalEntryRepository
}) => ({
  execute: async (companyId: string, period: { start: string; end: string }) => {
    const accounts = await accountRepository.getAll()
    const entries = await journalEntryRepository.findByCompanyAndPeriod(companyId, new Date(period.start), new Date(period.end))

    const report = calculateIncomeStatementFromEntries({
      companyId,
      period,
      entries,
      accounts,
    })

    const snapshot: IncomeStatementSnapshot = {
      id: randomUUID(),
      companyId,
      period: {
        start: period.start,
        end: period.end,
      },
      sections: report.sections,
      totals: report.totals,
      generatedAt: new Date(),
    }

    await incomeStatementRepository.save(snapshot)

    return report
  },
})
