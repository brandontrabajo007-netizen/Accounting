import type { LedgerPoster } from '@application/journal/ports/LedgerPoster'
import type { AccountRepository } from '@application/shared/ports/AccountRepository'
import type { LedgerBalanceRepository } from '@application/shared/ports/LedgerBalanceRepository'
import { AccountType } from '@domain/accounts/AccountType'
import type { JournalEntry } from '@domain/journal-entries/JournalEntry'
import { MovementStatus } from '@domain/movements/MovementStatus'
import { TransactionTypes } from '@domain/movements/TransactionType'
import { LedgerMovementMongoModel } from '../persistence/mongo/models/LedgerMovementModel'
export class MongoLedgerPoster implements LedgerPoster {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly balances: LedgerBalanceRepository,
  ) {}

  async post(entry: JournalEntry): Promise<void> {
    // 2. Procesar movimientos
    for (const movement of entry.movements) {
      try {
        const account = await this.accounts.getByCode(movement.accountCode)
        if (!account) {
          console.warn(`Cuenta ${movement.accountCode} no existe, salto movimiento`)
          movement.status = MovementStatus.PENDING
          continue
        }

        // Inicializar a 0 si no existe
        const currentBalance = (await this.balances.get(entry.companyId, movement.accountCode)) ?? 0

        let newBalance = currentBalance

        // Reglas correctas (lowercase)
        const increaseIsDebit = account.type === AccountType.ASSET || account.type === AccountType.EXPENSE

        const increaseIsCredit = account.type === AccountType.LIABILITY || account.type === AccountType.EQUITY || account.type === AccountType.INCOME

        if (increaseIsDebit) {
          newBalance = movement.type === TransactionTypes.DEBIT ? newBalance + movement.amount : newBalance - movement.amount
        } else if (increaseIsCredit) {
          newBalance = movement.type === TransactionTypes.CREDIT ? newBalance + movement.amount : newBalance - movement.amount
        }

        // 3. Guardar nuevo saldo
        await this.balances.update(entry.companyId, movement.accountCode, newBalance)

        // 4. Guardar movimiento en ledgerMovements
        await LedgerMovementMongoModel.create({
          accountCode: movement.accountCode,
          debit: movement.type === TransactionTypes.DEBIT ? movement.amount : 0,
          credit: movement.type === TransactionTypes.CREDIT ? movement.amount : 0,
          date: entry.date,
          journalEntryId: entry.id,
          description: entry.description,
          companyId: entry.companyId,
          status: MovementStatus.PROCESSED,
        })
        movement.status = MovementStatus.PROCESSED
      } catch (error) {
        console.error(`Error procesando movimiento cuenta ${movement.accountCode}:`, error)
        movement.status = MovementStatus.PENDING
      }
    }
  }
}
