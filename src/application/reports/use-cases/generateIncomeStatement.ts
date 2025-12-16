// src/application/reports/use-cases/generateIncomeStatement.ts

import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import { getIncomeStatement } from '../presenters/getIncomeStatement'

type Dependencies = {
  journalEntryRepository: JournalEntryRepository
  accountRepository: AccountRepository
}

export const makeGenerateIncomeStatement = (deps: Dependencies) => {
  const { journalEntryRepository, accountRepository } = deps

  return {
    generateIncomeStatement: async (companyId: string, period: { start: Date; end: Date }) => {
      // Obtener todos los Journal Entries de la empresa
      const entries = await journalEntryRepository.findByCompanyAndPeriod(companyId, period.start, period.end)

      // Obtener plan de cuentas de la empresa
      const accounts = await accountRepository.getAll()

      // Generar el estado de resultados usando el presenter
      const result = getIncomeStatement(entries, accounts, period)

      return result
    },
  }
}
