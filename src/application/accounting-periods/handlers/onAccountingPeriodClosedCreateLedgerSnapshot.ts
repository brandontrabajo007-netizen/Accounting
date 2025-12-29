import { randomUUID } from 'node:crypto'
import type { LedgerSnapshotRepository } from '../ports/LedgerSnapshotRepository'
import type { AccountingPeriodClosed } from '@domain/accounting-periods/events/AccountingPeriodClosed'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { AccountingPeriodRepository } from '../ports/AccountingPeriodRepository'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'
import { AccountType } from '@domain/accounts/AccountType'
import { EventType } from '@domain/events/EventType.enum'

type Dependencies = {
  ledgerSnapshotRepository: LedgerSnapshotRepository
  accountRepository: AccountRepository
  accountingPeriodRepository: AccountingPeriodRepository
  journalEntryRepository: JournalEntryRepository
}

export const makeOnAccountingPeriodClosedCreateLedgerSnapshot = ({
  ledgerSnapshotRepository,
  accountRepository,
  accountingPeriodRepository,
  journalEntryRepository,
}: Dependencies) => {
  const handler = async (event: unknown) => {
    const typed = event as AccountingPeriodClosed
    if (!typed || typed.type !== 'accounting.period.closed') return

    const { companyId, periodId } = typed.payload

    const period = await accountingPeriodRepository.findById(periodId)
    if (!period) {
      throw new Error('Accounting period not found for snapshot')
    }

    const accounts = await accountRepository.getAll()
    const entries = await journalEntryRepository.findByPeriodId(companyId, periodId)

    const accountMap = new Map<number, (typeof accounts)[number]>()
    accounts.forEach((a) => accountMap.set(a.code, a))

    const increaseIsDebit = (accountType: AccountType) => accountType === AccountType.ASSET || accountType === AccountType.EXPENSE
    const increaseIsCredit = (accountType: AccountType) =>
      accountType === AccountType.LIABILITY || accountType === AccountType.EQUITY || accountType === AccountType.INCOME

    const balanceByAccount = new Map<number, number>()

    for (const entry of entries) {
      for (const movement of entry.movements) {
        if (movement.status !== MovementStatus.PROCESSED) continue

        const account = accountMap.get(movement.accountCode)
        if (!account) continue

        // En asientos de cierre solo consideramos el impacto en patrimonio,
        // evitando que ingresos/gastos queden en cero en el snapshot.
        if (entry.eventType === EventType.CLOSING && account.type !== AccountType.EQUITY) continue

        const delta =
          increaseIsDebit(account.type) && movement.type === TransactionTypes.DEBIT
            ? movement.amount
            : increaseIsDebit(account.type) && movement.type === TransactionTypes.CREDIT
              ? -movement.amount
              : increaseIsCredit(account.type) && movement.type === TransactionTypes.CREDIT
                ? movement.amount
                : -movement.amount

        balanceByAccount.set(movement.accountCode, (balanceByAccount.get(movement.accountCode) ?? 0) + delta)
      }
    }

    const lines = accounts.map((account) => ({
      accountCode: account.code,
      accountName: account.name,
      balance: balanceByAccount.get(account.code) ?? 0,
    }))

    const existing = await ledgerSnapshotRepository.findByPeriod(companyId, periodId)

    const snapshot = {
      id: existing?.id ?? randomUUID(),
      companyId,
      periodId,
      period: { start: period.start, end: period.end },
      lines,
      generatedAt: new Date(),
    }

    await ledgerSnapshotRepository.save(snapshot)
  }

  return handler
}
