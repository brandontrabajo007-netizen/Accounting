export type IncomeStatementPdfModel = {
  companyId: string
  title: string
  description: string
  period: { start: string; end: string }
  sections: {
    name: string
    total: number
    accounts: { code: number; name: string; total: number }[]
  }[]
  totals: {
    grossProfit: number
    operatingIncome: number
    incomeBeforeTaxes: number
    netIncome?: number
  }
  generatedAt: string
}

export type GeneratedPdf = { filename: string; stream: NodeJS.ReadableStream }

export interface ReportPdfGenerator {
  generateIncomeStatement(model: IncomeStatementPdfModel): Promise<GeneratedPdf>
}
