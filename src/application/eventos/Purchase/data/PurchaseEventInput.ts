export type PurchaseEventInput = {
  description: string | null
  debitAccount: number | null // usuario elige la cuenta del DEBE
  amount: number | null
  includesVAT?: boolean
  paymentMethod: 'cash' | 'bank' | 'credit' | null
  supplier?: string | null
  companyId: string | null
  date?: string | null
}
