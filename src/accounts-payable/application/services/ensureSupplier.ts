import type { Supplier } from '../../domain/Supplier'
import { normalizeSupplierName } from '../../domain/normalizeSupplierName'
import type { SupplierRepository } from '../ports/SupplierRepository'

export const ensureSupplier = async (supplierRepository: SupplierRepository, companyId: string, name: string): Promise<Supplier> => {
  const normalizedName = normalizeSupplierName(name)
  const existing = await supplierRepository.findByNormalizedName(companyId, normalizedName)
  if (existing) return existing

  return supplierRepository.create({
    companyId,
    name: name.trim(),
    normalizedName,
  })
}
