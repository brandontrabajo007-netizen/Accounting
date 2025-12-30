import type { IncomeStatementRepository } from '@application/shared/ports/IncomeStatementRepository'
import type { ReportPdfGenerator } from '../ports/ReportPdfGenerator'

type Dependencies = {
  incomeStatementRepository: IncomeStatementRepository
  reportPdfGenerator: ReportPdfGenerator
}

export const makeGenerateIncomeStatementSnapshotPdf = ({ incomeStatementRepository, reportPdfGenerator }: Dependencies) => {
  return {
    execute: async (companyId: string, snapshotId: string) => {
      const snapshot = await incomeStatementRepository.findById(snapshotId)
      if (!snapshot || snapshot.companyId !== companyId) {
        throw new Error('Estado de resultados no encontrado')
      }

      return reportPdfGenerator.generateIncomeStatement({
        companyId,
        title: 'Estado de Resultados',
        description: `Periodo ${snapshot.period.start} - ${snapshot.period.end}`,
        period: snapshot.period,
        sections: snapshot.sections,
        totals: snapshot.totals,
        generatedAt: snapshot.generatedAt instanceof Date ? snapshot.generatedAt.toISOString() : snapshot.generatedAt,
      })
    },
  }
}
