// src/application/reports/use-cases/generateIncomeStatement.ts

import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import { calculateIncomeStatementFromEntries } from '../services/calculateIncomeStatementFromEntries'

type Dependencies = {
  accountRepository: AccountRepository
  journalEntryRepository: JournalEntryRepository
}

export const makeGenerateIncomeStatement = ({ accountRepository, journalEntryRepository }: Dependencies) => {
  return {
    generateIncomeStatement: async (companyId: string, period: { start: string; end: string }) => {
      const accounts = await accountRepository.getAll()
      const entries = await journalEntryRepository.findByCompanyAndPeriod(companyId, new Date(period.start), new Date(period.end))

      return calculateIncomeStatementFromEntries({
        companyId,
        period,
        entries,
        accounts,
      })
    },
  }
}
