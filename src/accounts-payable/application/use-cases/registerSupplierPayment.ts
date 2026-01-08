import type { ApEntry } from '../../domain/ApEntry'
import type { ApEntryRepository } from '../ports/ApEntryRepository'
import type { SupplierRepository } from '../ports/SupplierRepository'
import { ensureSupplier } from '../services/ensureSupplier'

export interface RegisterSupplierPaymentInput {
  companyId: string
  supplierName: string
  amount: number
  date?: Date
  source?: {
    note?: string
    referenceId?: string
  }
}

export const makeRegisterSupplierPayment = (deps: { supplierRepository: SupplierRepository; apEntryRepository: ApEntryRepository }) => {
  const registerSupplierPayment = async (input: RegisterSupplierPaymentInput): Promise<ApEntry | null> => {
    if (!input.supplierName?.trim()) return null
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null

    const supplier = await ensureSupplier(deps.supplierRepository, input.companyId, input.supplierName)

    return deps.apEntryRepository.add({
      companyId: input.companyId,
      supplierId: supplier.id,
      type: 'debit',
      amount: input.amount,
      date: input.date ?? new Date(),
      source: {
        kind: 'payment',
        note: input.source?.note,
        referenceId: input.source?.referenceId,
      },
    })
  }

  return { registerSupplierPayment }
}
