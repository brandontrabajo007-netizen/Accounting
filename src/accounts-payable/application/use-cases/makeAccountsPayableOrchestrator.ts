import type { AccountsPayableSettingsRepository } from '../ports/AccountsPayableSettingsRepository'
import type { ApEntryRepository } from '../ports/ApEntryRepository'
import type { SupplierRepository } from '../ports/SupplierRepository'
import { makeRegisterSupplierDebt } from './registerSupplierDebt'
import { makeRegisterSupplierPayment } from './registerSupplierPayment'

export interface RegisterPurchaseApInput {
  companyId: string
  supplierName?: string | null
  amount: number
  date?: Date
  journalEntryId?: string
  description?: string
  paymentMethod?: string | null
}

const isCreditPurchase = (paymentMethod: string | null | undefined) => paymentMethod === 'credit'

export const makeAccountsPayableOrchestrator = (deps: {
  supplierRepository: SupplierRepository
  apEntryRepository: ApEntryRepository
  settingsRepository: AccountsPayableSettingsRepository
}) => {
  const { registerSupplierDebt } = makeRegisterSupplierDebt({
    supplierRepository: deps.supplierRepository,
    apEntryRepository: deps.apEntryRepository,
  })
  const { registerSupplierPayment } = makeRegisterSupplierPayment({
    supplierRepository: deps.supplierRepository,
    apEntryRepository: deps.apEntryRepository,
  })

  const isEnabled = async (companyId: string) => {
    const settings = await deps.settingsRepository.getByCompanyId(companyId)
    return settings?.enabled ?? false
  }

  const registerPurchaseIfNeeded = async (input: RegisterPurchaseApInput) => {
    if (!input.supplierName?.trim()) return null
    const settings = await deps.settingsRepository.getByCompanyId(input.companyId)
    if (!settings?.enabled) return null

    const shouldCreateDebt = isCreditPurchase(input.paymentMethod ?? null)
    if (!shouldCreateDebt) return null

    return registerSupplierDebt({
      companyId: input.companyId,
      supplierName: input.supplierName,
      amount: input.amount,
      date: input.date,
      source: {
        referenceId: input.journalEntryId,
        note: input.description,
      },
    })
  }

  const registerSupplierPaymentIfNeeded = async (input: {
    companyId: string
    supplierName?: string | null
    amount: number
    date?: Date
    journalEntryId?: string
    description?: string
    paymentMethod?: string | null
  }) => {
    if (!input.supplierName?.trim()) return null
    const settings = await deps.settingsRepository.getByCompanyId(input.companyId)
    if (!settings?.enabled) return null

    return registerSupplierPayment({
      companyId: input.companyId,
      supplierName: input.supplierName,
      amount: input.amount,
      date: input.date,
      source: {
        referenceId: input.journalEntryId,
        note: input.paymentMethod ?? input.description,
      },
    })
  }

  return { registerPurchaseIfNeeded, registerSupplierPaymentIfNeeded, isEnabled }
}
