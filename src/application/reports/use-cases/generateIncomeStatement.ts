// src/application/reports/use-cases/generateIncomeStatement.ts

import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import { getIncomeStatement } from '../presenters/getIncomeStatement'

type Dependencies = {
  accountRepository: AccountRepository
}

export const makeGenerateIncomeStatement = ({ accountRepository }: Dependencies) => {
  return {
    generateIncomeStatement: async (companyId: string, period: { start: string; end: string }) => {
      const accounts = await accountRepository.getAll()
      const result = getIncomeStatement(accounts, companyId, period)

      return result
    },
  }
}
