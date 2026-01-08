import type { ArEntry } from '../../domain/ArEntry'
import type { ArEntryRepository } from '../ports/ArEntryRepository'
import type { CustomerRepository } from '../ports/CustomerRepository'
import { ensureCustomer } from '../services/ensureCustomer'

export interface RegisterCustomerDebtInput {
  companyId: string
  customerName: string
  amount: number
  date?: Date
  source: {
    referenceId?: string
    note?: string
  }
}

export const makeRegisterCustomerDebt = (deps: { customerRepository: CustomerRepository; arEntryRepository: ArEntryRepository }) => {
  const registerCustomerDebt = async (input: RegisterCustomerDebtInput): Promise<ArEntry | null> => {
    if (!input.customerName?.trim()) return null
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null

    const customer = await ensureCustomer(deps.customerRepository, input.companyId, input.customerName)

    return deps.arEntryRepository.add({
      companyId: input.companyId,
      customerId: customer.id,
      type: 'debit',
      amount: input.amount,
      date: input.date ?? new Date(),
      source: {
        kind: 'sale',
        referenceId: input.source.referenceId,
        note: input.source.note,
      },
    })
  }

  return { registerCustomerDebt }
}
