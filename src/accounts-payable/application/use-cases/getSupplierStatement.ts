import { normalizeSupplierName } from '../../domain/normalizeSupplierName'
import type { ApEntryRepository } from '../ports/ApEntryRepository'
import type { SupplierRepository } from '../ports/SupplierRepository'
import type { SupplierHistoryRepository } from '@supplier-history/application/ports/SupplierHistoryRepository'

export const makeGetSupplierStatement = (deps: {
  supplierRepository: SupplierRepository
  apEntryRepository: ApEntryRepository
  supplierHistoryRepository: SupplierHistoryRepository
}) => {
  const getSupplierStatement = async (input: { companyId: string; supplierName: string }) => {
    const normalized = normalizeSupplierName(input.supplierName)
    const supplier = await deps.supplierRepository.findByNormalizedName(input.companyId, normalized)
    if (!supplier) return null

    const [historyEntries, balance] = await Promise.all([
      deps.supplierHistoryRepository.listBySupplier(input.companyId, supplier.id),
      deps.apEntryRepository.getBalanceBySupplier(input.companyId, supplier.id),
    ])

    return { supplier, balance, entries: historyEntries.items }
  }

  return { getSupplierStatement }
}
