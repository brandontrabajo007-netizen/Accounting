import { normalizeCustomerName } from '../../domain/normalizeCustomerName'
import type { ArEntryRepository } from '../ports/ArEntryRepository'
import type { CustomerHistoryRepository } from '../ports/CustomerHistoryRepository'
import type { CustomerRepository } from '../ports/CustomerRepository'

export const makeGetCustomerStatement = (deps: { customerRepository: CustomerRepository; arEntryRepository: ArEntryRepository; customerHistoryRepository: CustomerHistoryRepository }) => {
  const getCustomerStatement = async (input: { companyId: string; customerName: string }) => {
    const normalized = normalizeCustomerName(input.customerName)
    const customer = await deps.customerRepository.findByNormalizedName(input.companyId, normalized)
    if (!customer) return null

    const [historyEntries, balance] = await Promise.all([
      deps.customerHistoryRepository.listByCustomer(input.companyId, customer.id),
      deps.arEntryRepository.getBalanceByCustomer(input.companyId, customer.id),
    ])

    return { customer, balance, entries: historyEntries.items }
  }

  return { getCustomerStatement }
}
