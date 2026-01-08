export type SupplierPaymentEventInput = {
  companyId: string
  supplierName?: string | null
  amount: number
  paymentMethod?: string | null
  date?: string | null
  periodId?: string
  periodHint?: string | null
  allowClosedReopen?: boolean
  description?: string
}
