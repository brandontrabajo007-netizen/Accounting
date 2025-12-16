"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoLedgerPoster = void 0;
const AccountType_1 = require("@domain/accounts/AccountType");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const LedgerMovementModel_1 = require("../persistence/mongo/models/LedgerMovementModel");
class MongoLedgerPoster {
    constructor(accounts, balances) {
        this.accounts = accounts;
        this.balances = balances;
    }
    async post(entry) {
        // 2. Procesar movimientos
        for (const movement of entry.movements) {
            try {
                const account = await this.accounts.getByCode(movement.accountCode);
                if (!account) {
                    console.warn(`Cuenta ${movement.accountCode} no existe, salto movimiento`);
                    movement.status = MovementStatus_1.MovementStatus.PENDING;
                    continue;
                }
                // Inicializar a 0 si no existe
                const currentBalance = (await this.balances.get(entry.companyId, movement.accountCode)) ?? 0;
                let newBalance = currentBalance;
                // Reglas correctas (lowercase)
                const increaseIsDebit = account.type === AccountType_1.AccountType.ASSET || account.type === AccountType_1.AccountType.EXPENSE;
                const increaseIsCredit = account.type === AccountType_1.AccountType.LIABILITY || account.type === AccountType_1.AccountType.EQUITY || account.type === AccountType_1.AccountType.INCOME;
                if (increaseIsDebit) {
                    newBalance = movement.type === TransactionType_1.TransactionTypes.DEBIT ? newBalance + movement.amount : newBalance - movement.amount;
                }
                else if (increaseIsCredit) {
                    newBalance = movement.type === TransactionType_1.TransactionTypes.CREDIT ? newBalance + movement.amount : newBalance - movement.amount;
                }
                // 3. Guardar nuevo saldo
                await this.balances.update(entry.companyId, movement.accountCode, newBalance);
                // 4. Guardar movimiento en ledgerMovements
                await LedgerMovementModel_1.LedgerMovementMongoModel.create({
                    accountCode: movement.accountCode,
                    debit: movement.type === TransactionType_1.TransactionTypes.DEBIT ? movement.amount : 0,
                    credit: movement.type === TransactionType_1.TransactionTypes.CREDIT ? movement.amount : 0,
                    date: entry.date,
                    journalEntryId: entry.id,
                    description: entry.description,
                    companyId: entry.companyId,
                    status: MovementStatus_1.MovementStatus.PROCESSED,
                });
                movement.status = MovementStatus_1.MovementStatus.PROCESSED;
            }
            catch (error) {
                console.error(`Error procesando movimiento cuenta ${movement.accountCode}:`, error);
                movement.status = MovementStatus_1.MovementStatus.PENDING;
            }
        }
    }
}
exports.MongoLedgerPoster = MongoLedgerPoster;
