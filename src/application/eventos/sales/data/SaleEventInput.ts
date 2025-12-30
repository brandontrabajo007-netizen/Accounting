// src/application/dtos/SaleEventInput.ts
export type SaleEventInput = {
  description: string
  totalAmount: number
  date?: string
  periodHint?: string
  allowClosedReopen?: boolean
  includesVAT?: boolean
  includesCost?: boolean
  quantity?: number
  unitCost?: number
  unitPrice?: number
  companyId: string // muy importante para buscar mapping y catálogo de cuentas
  periodId?: string
}
