import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'

import { EventType } from '@domain/events/EventType.enum'
import { generatePayrollJournalEntry } from '@domain/events/payroll/generatePayrollJournalEntry'
import type { PayrollEvent } from '@domain/events/payroll/PayrollEvent'
import { validatePayrollAccount } from '@domain/events/payroll/validatePayrollAccount'

import type { JournalEntry } from '@domain/journal-entries/JournalEntry'

import { presentJournalEntry } from '../../sales/presenters/presentJournalEntry'
import type { PayrollEventInput } from '../data/PayrollEventInput'
import type { PayrollAccountMappingRepository } from '../ports/PayrollAccountMappingRepository'

export interface MakeRegisterPayrollDeps {
  accountRepository: AccountRepository
  payrollAccountMappingRepository: PayrollAccountMappingRepository
  journalEntryRepository: JournalEntryRepository
  processJournalEntry: { process: (id: string) => Promise<JournalEntry> }
}

export const makeRegisterPayroll = ({ accountRepository, payrollAccountMappingRepository, journalEntryRepository, processJournalEntry }: MakeRegisterPayrollDeps) => {
  const registerPayroll = async (input: PayrollEventInput) => {
    const date = input.date ? new Date(input.date) : new Date()

    // 1️⃣ Catálogo contable completo
    const catalog = await accountRepository.getAll()

    // 2️⃣ Mapping de cuentas
    const mapping = await payrollAccountMappingRepository.getPayrollAccountMappingByCompanyId(input.companyId)

    // 3️⃣ Construir evento de dominio
    const payrollEvent: PayrollEvent = {
      type: EventType.PAYROLL,
      companyId: input.companyId,
      description: input.description,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      beneficiary: input.beneficiary,
      date,
      toJournalEntry: (config) => generatePayrollJournalEntry(payrollEvent, config, catalog),
    }

    // 4️⃣ Validación de cuentas
    validatePayrollAccount(mapping, catalog, payrollEvent)

    // 5️⃣ Generar asiento
    let journalEntry = generatePayrollJournalEntry(payrollEvent, mapping, catalog)

    // 6️⃣ Guardar asiento
    await journalEntryRepository.save(journalEntry)

    // 7️⃣ Procesar movimientos
    journalEntry = await processJournalEntry.process(journalEntry.id)

    // 8️⃣ Presentar salida consistente
    return presentJournalEntry(journalEntry, catalog)
  }

  return { registerPayroll }
}
