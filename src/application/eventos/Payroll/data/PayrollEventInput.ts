export interface PayrollEventInput {
  companyId: string
  description: string
  amount: number
  paymentMethod: 'cash' | 'bank'
  date?: string
  beneficiary?: string
  periodId?: string
  periodHint?: string
  allowClosedReopen?: boolean
}
