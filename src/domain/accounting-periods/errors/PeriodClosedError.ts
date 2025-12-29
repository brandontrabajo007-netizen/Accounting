export const makePeriodClosedError = (periodId: string) => {
  const error = new Error(`Accounting period ${periodId} is closed. No modifications are allowed.`)
  error.name = 'PeriodClosedError'
  return error
}
