export type CustomerPaymentEventInput = {
  amount: number
  date?: string
  periodHint?: string
  allowClosedReopen?: boolean
  paymentMethod?: string
  customerName?: string
  companyId: string
  periodId?: string
  description?: string
}
