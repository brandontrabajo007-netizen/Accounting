import { normalizeSupplierName } from '../../domain/normalizeSupplierName'
import type { ApEntryRepository } from '../ports/ApEntryRepository'
import type { SupplierRepository } from '../ports/SupplierRepository'

export const makeGetSupplierBalance = (deps: { supplierRepository: SupplierRepository; apEntryRepository: ApEntryRepository }) => {
  const getSupplierBalance = async (input: { companyId: string; supplierName: string }) => {
    const normalized = normalizeSupplierName(input.supplierName)
    const supplier = await deps.supplierRepository.findByNormalizedName(input.companyId, normalized)
    if (!supplier) return null

    const balance = await deps.apEntryRepository.getBalanceBySupplier(input.companyId, supplier.id)
    return { supplier, balance }
  }

  return { getSupplierBalance }
}
