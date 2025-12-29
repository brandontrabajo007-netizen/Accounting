export type PeriodResult = {
  id: string
  companyId: string
  periodId: string
  period: {
    start: Date
    end: Date
  }
  incomeStatement: {
    sections: {
      name: string
      total: number
      accounts: {
        code: number
        name: string
        total: number
      }[]
    }[]
    totals: {
      grossProfit: number
      operatingIncome: number
      incomeBeforeTaxes: number
      netIncome?: number
    }
  }
  generatedAt: Date
}
