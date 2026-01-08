import type { ApEntryRepository } from '../ports/ApEntryRepository'
import type { SupplierRepository } from '../ports/SupplierRepository'

export const makeListSuppliersWithBalance = (deps: { supplierRepository: SupplierRepository; apEntryRepository: ApEntryRepository }) => {
  const listSuppliersWithBalance = async (input: { companyId: string }) => {
    const balances = await deps.apEntryRepository.listBalancesByCompany(input.companyId)
    const nonZero = balances.filter((item) => item.balance !== 0)
    if (nonZero.length === 0) return []

    const suppliers = await deps.supplierRepository.findByIds(nonZero.map((item) => item.supplierId))
    const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]))

    return nonZero
      .map((item) => {
        const supplier = supplierMap.get(item.supplierId)
        if (!supplier) return null
        return {
          supplier,
          balance: item.balance,
        }
      })
      .filter((item): item is { supplier: typeof suppliers[number]; balance: number } => Boolean(item))
  }

  return { listSuppliersWithBalance }
}
