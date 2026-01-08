import type { ApEntry } from '../../domain/ApEntry'
import type { ApEntryRepository } from '../ports/ApEntryRepository'
import type { SupplierRepository } from '../ports/SupplierRepository'
import { ensureSupplier } from '../services/ensureSupplier'

export interface RegisterSupplierDebtInput {
  companyId: string
  supplierName: string
  amount: number
  date?: Date
  source: {
    referenceId?: string
    note?: string
  }
}

export const makeRegisterSupplierDebt = (deps: { supplierRepository: SupplierRepository; apEntryRepository: ApEntryRepository }) => {
  const registerSupplierDebt = async (input: RegisterSupplierDebtInput): Promise<ApEntry | null> => {
    if (!input.supplierName?.trim()) return null
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null

    const supplier = await ensureSupplier(deps.supplierRepository, input.companyId, input.supplierName)

    return deps.apEntryRepository.add({
      companyId: input.companyId,
      supplierId: supplier.id,
      type: 'credit',
      amount: input.amount,
      date: input.date ?? new Date(),
      source: {
        kind: 'purchase',
        referenceId: input.source.referenceId,
        note: input.source.note,
      },
    })
  }

  return { registerSupplierDebt }
}
