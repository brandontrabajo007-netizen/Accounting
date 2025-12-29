import { randomUUID } from 'node:crypto'
import type { JournalEntryRepository } from '@application/shared/ports/JournalEntryRepository'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { AccountingPeriodClosed } from '@domain/accounting-periods/events/AccountingPeriodClosed'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'
import { AccountType } from '@domain/accounts/AccountType'
import type { LedgerPoster } from '@application/journal/ports/LedgerPoster'
import { JournalEntryStatus } from '@domain/journal-entries/JournalEntryStatus'
import { EventType } from '@domain/events/EventType.enum'

type Dependencies = {
  journalEntryRepository: JournalEntryRepository
  accountRepository: AccountRepository
  ledgerPoster: LedgerPoster
  equityAccountCode: number
}

export const makeOnAccountingPeriodClosedCreateClosingEntry = ({
  journalEntryRepository,
  accountRepository,
  ledgerPoster,
  equityAccountCode,
}: Dependencies) => {
  const handler = async (event: unknown) => {
    const typed = event as AccountingPeriodClosed
    if (!typed || typed.type !== 'accounting.period.closed') return

    const { companyId, periodId } = typed.payload

    const existing = await journalEntryRepository.findByPeriodId(companyId, periodId)
    const previousClosingEntry = existing.find((e) => e.systemGenerated && e.periodId === periodId)

    const accounts = await accountRepository.getAll()
    const accountMap = new Map<number, (typeof accounts)[number]>()
    accounts.forEach((a) => accountMap.set(a.code, a))

    // recomputar balances del periodo usando asientos (sin el asiento de cierre previo)
    const periodEntries = existing.filter((e) => e.eventType !== EventType.CLOSING)
    const balanceByAccount = new Map<number, number>()

    const increaseIsDebit = (accountType: AccountType) => accountType === AccountType.ASSET || accountType === AccountType.EXPENSE
    const increaseIsCredit = (accountType: AccountType) =>
      accountType === AccountType.LIABILITY || accountType === AccountType.EQUITY || accountType === AccountType.INCOME

    for (const entry of periodEntries) {
      for (const movement of entry.movements) {
        if (movement.status !== MovementStatus.PROCESSED) continue

        const account = accountMap.get(movement.accountCode)
        if (!account) continue

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

    const movements = []

    let totalIncome = 0
    let totalExpense = 0

    for (const account of accounts) {
      if (account.type !== AccountType.INCOME && account.type !== AccountType.EXPENSE) continue

      const balance = balanceByAccount.get(account.code) ?? 0
      if (balance === 0) continue

      if (account.type === AccountType.INCOME) {
        totalIncome += balance
        movements.push({
          accountCode: account.code,
          accountName: account.name,
          type: balance >= 0 ? TransactionTypes.DEBIT : TransactionTypes.CREDIT,
          amount: Math.abs(balance),
          status: MovementStatus.PROCESSED,
          group: 'MAIN' as const,
        })
      }

      if (account.type === AccountType.EXPENSE) {
        totalExpense += balance
        movements.push({
          accountCode: account.code,
          accountName: account.name,
          type: balance >= 0 ? TransactionTypes.CREDIT : TransactionTypes.DEBIT,
          amount: Math.abs(balance),
          status: MovementStatus.PROCESSED,
          group: 'MAIN' as const,
        })
      }
    }

    const netResult = totalIncome - totalExpense
    if (netResult !== 0) {
      const equityAccount = accounts.find((a) => a.code === equityAccountCode)
      if (!equityAccount) {
        throw new Error(`Equity account ${equityAccountCode} not found for closing entry`)
      }

      movements.push({
        accountCode: equityAccount.code,
        accountName: equityAccount.name,
        type: netResult > 0 ? TransactionTypes.CREDIT : TransactionTypes.DEBIT,
        amount: Math.abs(netResult),
        status: MovementStatus.PROCESSED,
        group: 'MAIN' as const,
      })
    }

    if (movements.length === 0 && !previousClosingEntry) return

    const entry = {
      id: previousClosingEntry?.id ?? randomUUID(),
      companyId,
      periodId,
      date: previousClosingEntry?.date ?? new Date(),
      description: 'Asiento de cierre del periodo',
      status: JournalEntryStatus.PROCESSED,
      movements,
      systemGenerated: true,
      eventType: EventType.CLOSING,
    }

    await journalEntryRepository.save(entry)
    await ledgerPoster.post(entry, previousClosingEntry ?? null)
  }

  return handler
}
