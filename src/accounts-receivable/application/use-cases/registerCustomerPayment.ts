import type { ArEntry } from '../../domain/ArEntry'
import type { ArEntryRepository } from '../ports/ArEntryRepository'
import type { CustomerRepository } from '../ports/CustomerRepository'
import { ensureCustomer } from '../services/ensureCustomer'

export interface RegisterCustomerPaymentInput {
  companyId: string
  customerName: string
  amount: number
  date?: Date
  source?: {
    note?: string
    referenceId?: string
  }
}

export const makeRegisterCustomerPayment = (deps: { customerRepository: CustomerRepository; arEntryRepository: ArEntryRepository }) => {
  const registerCustomerPayment = async (input: RegisterCustomerPaymentInput): Promise<ArEntry | null> => {
    if (!input.customerName?.trim()) return null
    if (!Number.isFinite(input.amount) || input.amount <= 0) return null

    const customer = await ensureCustomer(deps.customerRepository, input.companyId, input.customerName)

    return deps.arEntryRepository.add({
      companyId: input.companyId,
      customerId: customer.id,
      type: 'credit',
      amount: input.amount,
      date: input.date ?? new Date(),
      source: {
        kind: 'payment',
        note: input.source?.note,
        referenceId: input.source?.referenceId,
      },
    })
  }

  return { registerCustomerPayment }
}
