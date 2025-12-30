import type { ReportPdfGenerator } from '../ports/ReportPdfGenerator'
import type { IncomeStatementResult } from '../presenters/IncomeStatementResult'

type Dependencies = {
  generateIncomeStatement: (companyId: string, period: { start: string; end: string }) => Promise<IncomeStatementResult>
  reportPdfGenerator: ReportPdfGenerator
}

export const makeGenerateIncomeStatementPdf = ({ generateIncomeStatement, reportPdfGenerator }: Dependencies) => {
  return {
    execute: async (companyId: string, period: { start: string; end: string }) => {
      const result = await generateIncomeStatement(companyId, period)

      return reportPdfGenerator.generateIncomeStatement({
        companyId,
        title: result.name,
        description: result.description,
        period: result.period,
        sections: result.sections,
        totals: result.totals,
        generatedAt: result.generatedAt,
      })
    },
  }
}
