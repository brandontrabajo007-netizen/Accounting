import type { LedgerPoster } from '@application/journal/ports/LedgerPoster'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { Account } from '@domain/accounts/Account'
import { AccountType } from '@domain/accounts/AccountType'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'
import { LedgerMovementMongoModel } from '../persistence/mongo/models/LedgerMovementModel'

export class MongoLedgerPoster implements LedgerPoster {
  constructor(
    private readonly accounts: AccountRepository,
  ) {}

  private async getAccountCached(code: number, cache: Map<number, Account | null>): Promise<Account | null> {
    if (cache.has(code)) return cache.get(code) ?? null
    try {
      const account = await this.accounts.getByCode(code)
      cache.set(code, account)
      return account
    } catch (_err) {
      console.warn(`Cuenta ${code} no existe, marco movimiento como pendiente`)
      cache.set(code, null as unknown as Account)
      return null
    }
  }

  private async computeEffects(entry: JournalEntry, accountCache: Map<number, Account | null>, mutateMovements: boolean): Promise<Map<number, number>> {
    const effects = new Map<number, number>()
    for (const movement of entry.movements) {
      const shouldApply = movement.status === MovementStatus.PROCESSED || movement.status === MovementStatus.CREATED
      if (!shouldApply) continue

      if (movement.amount <= 0) {
        if (mutateMovements) movement.status = MovementStatus.PENDING
        continue
      }

      const account = await this.getAccountCached(movement.accountCode, accountCache)
      if (!account) {
        if (mutateMovements) movement.status = MovementStatus.PENDING
        continue
      }

      const increaseIsDebit = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE
      const increaseIsCredit = account.type === AccountType.LIABILITY || account.type === AccountType.EQUITY || account.type === AccountType.INCOME

      const delta =
        increaseIsDebit && movement.type === TransactionTypes.DEBIT
          ? movement.amount
          : increaseIsDebit && movement.type === TransactionTypes.CREDIT
            ? -movement.amount
            : increaseIsCredit && movement.type === TransactionTypes.CREDIT
              ? movement.amount
              : -movement.amount

      effects.set(movement.accountCode, (effects.get(movement.accountCode) ?? 0) + delta)

      if (mutateMovements) movement.status = MovementStatus.PROCESSED
    }

    return effects
  }

  async post(entry: JournalEntry, previousEntry?: JournalEntry | null): Promise<void> {
    const accountCache = new Map<number, Account | null>()

    const previousEffects = previousEntry ? await this.computeEffects(previousEntry, accountCache, false) : new Map<number, number>()
    const newEffects = await this.computeEffects(entry, accountCache, true)

    const accountCodes = new Set<number>([...previousEffects.keys(), ...newEffects.keys()])

    for (const accountCode of accountCodes) {
      const prev = previousEffects.get(accountCode) ?? 0
      const next = newEffects.get(accountCode) ?? 0
      const delta = next - prev

      if (delta === 0) continue

      try {
        await this.accounts.applyBalanceDelta(entry.companyId, accountCode, delta)
      } catch (error) {
        console.error(`Error aplicando delta ${delta} a cuenta ${accountCode}:`, error)
      }
    }

    await LedgerMovementMongoModel.deleteMany({ companyId: entry.companyId, journalEntryId: entry.id })

    for (const movement of entry.movements) {
      if (movement.status !== MovementStatus.PROCESSED) continue
      await LedgerMovementMongoModel.create({
        accountCode: movement.accountCode,
        debit: movement.type === TransactionTypes.DEBIT ? movement.amount : 0,
        credit: movement.type === TransactionTypes.CREDIT ? movement.amount : 0,
        date: entry.date,
        journalEntryId: entry.id,
        description: entry.description,
        companyId: entry.companyId,
        status: MovementStatus.PROCESSED,
        periodId: entry.periodId,
      })
    }
  }
}


