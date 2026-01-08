import type { SupplierHistoryEntry } from '../../domain/SupplierHistoryEntry'
import type { SupplierHistoryRepository } from '../ports/SupplierHistoryRepository'
import type { SupplierRepository } from '@accounts-payable/application/ports/SupplierRepository'
import { ensureSupplier } from '@accounts-payable/application/services/ensureSupplier'

export interface RegisterSupplierHistoryPurchaseInput {
  companyId: string
  supplierName: string
  amount: number
  date?: Date
  description?: string
  paymentMethod?: string | null
  journalEntryId?: string
}

export interface RegisterSupplierHistoryPaymentInput {
  companyId: string
  supplierName: string
  amount: number
  date?: Date
  description?: string
  paymentMethod?: string | null
  journalEntryId?: string
}

export const makeRegisterSupplierHistory = (deps: { supplierRepository: SupplierRepository; supplierHistoryRepository: SupplierHistoryRepository }) => {
  const registerPurchaseHistory = async (input: RegisterSupplierHistoryPurchaseInput): Promise<SupplierHistoryEntry | null> => {
    if (!input.supplierName?.trim()) return null
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null

    const supplier = await ensureSupplier(deps.supplierRepository, input.companyId, input.supplierName)

    return deps.supplierHistoryRepository.add({
      companyId: input.companyId,
      supplierId: supplier.id,
      type: 'purchase',
      amount: input.amount,
      date: input.date ?? new Date(),
      description: input.description,
      paymentMethod: input.paymentMethod ?? undefined,
      journalEntryId: input.journalEntryId,
    })
  }

  const registerPaymentHistory = async (input: RegisterSupplierHistoryPaymentInput): Promise<SupplierHistoryEntry | null> => {
    if (!input.supplierName?.trim()) return null
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null

    const supplier = await ensureSupplier(deps.supplierRepository, input.companyId, input.supplierName)

    return deps.supplierHistoryRepository.add({
      companyId: input.companyId,
      supplierId: supplier.id,
      type: 'payment',
      amount: input.amount,
      date: input.date ?? new Date(),
      description: input.description,
      paymentMethod: input.paymentMethod ?? undefined,
      journalEntryId: input.journalEntryId,
    })
  }

  return { registerPurchaseHistory, registerPaymentHistory }
}
