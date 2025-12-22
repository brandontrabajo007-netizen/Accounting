import { randomUUID } from 'node:crypto'
import type { IncomeStatementSnapshot } from '@application/reports/types/IncomeStatementSnapshot'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { IncomeStatementRepository } from '@application/shared/ports/IncomeStatementRepository'
import { getIncomeStatement } from '../presenters/getIncomeStatement'

export const makeGenerateAndSaveIncomeStatement = ({
  accountRepository,
  incomeStatementRepository,
}: {
  accountRepository: AccountRepository
  incomeStatementRepository: IncomeStatementRepository
}) => ({
  execute: async (companyId: string, period: { start: string; end: string }) => {
    const accounts = await accountRepository.getAll()

    const report = getIncomeStatement(accounts, companyId, period)

    const snapshot: IncomeStatementSnapshot = {
      id: randomUUID(),
      companyId,
      period: {
        start: period.start, // 👈 string
        end: period.end, // 👈 string
      },
      sections: report.sections,
      totals: report.totals,
      generatedAt: new Date(), // 👈 aquí sí Date
    }

    await incomeStatementRepository.save(snapshot)

    return report
  },
})
