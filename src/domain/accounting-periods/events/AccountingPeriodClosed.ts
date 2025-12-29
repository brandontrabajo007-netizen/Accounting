export type AccountingPeriodClosed = {
  type: 'accounting.period.closed'
  payload: {
    companyId: string
    periodId: string
  }
}
