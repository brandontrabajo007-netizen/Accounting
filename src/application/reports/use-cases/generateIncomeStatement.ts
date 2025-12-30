// src/application/reports/use-cases/generateIncomeStatement.ts

import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import { calculateIncomeStatementFromEntries } from '../services/calculateIncomeStatementFromEntries'

const normalizeDate = (value: string, position: 'start' | 'end'): Date => {
  // Usa zona America/Bogota y asegura incluir todo el día final
  const datePart = value.slice(0, 10) // si viene con tiempo, nos quedamos con YYYY-MM-DD
  const suffix = position === 'start' ? 'T00:00:00.000-05:00' : 'T23:59:59.999-05:00'
  const d = new Date(`${datePart}${suffix}`)
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Fecha inválida: ${value}`)
  }
  return d
}

type Dependencies = {
  accountRepository: AccountRepository
  journalEntryRepository: JournalEntryRepository
}

export const makeGenerateIncomeStatement = ({ accountRepository, journalEntryRepository }: Dependencies) => {
  return {
    generateIncomeStatement: async (companyId: string, period: { start: string; end: string }) => {
      const accounts = await accountRepository.getAll()
      const entries = await journalEntryRepository.findByCompanyAndPeriod(
        companyId,
        normalizeDate(period.start, 'start'),
        normalizeDate(period.end, 'end'),
      )

      return calculateIncomeStatementFromEntries({
        companyId,
        period,
        entries,
        accounts,
      })
    },
  }
}
