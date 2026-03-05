"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoLedgerPoster = void 0;
const AccountType_1 = require("@domain/accounts/AccountType");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const LedgerMovementModel_1 = require("../persistence/mongo/models/LedgerMovementModel");
class MongoLedgerPoster {
    constructor(accounts) {
        this.accounts = accounts;
    }
    async getAccountCached(code, cache) {
        if (cache.has(code))
            return cache.get(code) ?? null;
        try {
            const account = await this.accounts.getByCode(code);
            cache.set(code, account);
            return account;
        }
        catch (_err) {
            console.warn(`Cuenta ${code} no existe, marco movimiento como pendiente`);
            cache.set(code, null);
            return null;
        }
    }
    async computeEffects(entry, accountCache, mutateMovements) {
        const effects = new Map();
        for (const movement of entry.movements) {
            const shouldApply = movement.status === MovementStatus_1.MovementStatus.PROCESSED || movement.status === MovementStatus_1.MovementStatus.CREATED;
            if (!shouldApply)
                continue;
            if (movement.amount <= 0) {
                if (mutateMovements && movement.status !== MovementStatus_1.MovementStatus.PROCESSED)
                    movement.status = MovementStatus_1.MovementStatus.PENDING;
                continue;
            }
            const account = await this.getAccountCached(movement.accountCode, accountCache);
            if (!account) {
                if (mutateMovements)
                    movement.status = MovementStatus_1.MovementStatus.PENDING;
                continue;
            }
            const increaseIsDebit = account.type === AccountType_1.AccountType.ASSET || account.type === AccountType_1.AccountType.EXPENSE;
            const increaseIsCredit = account.type === AccountType_1.AccountType.LIABILITY || account.type === AccountType_1.AccountType.EQUITY || account.type === AccountType_1.AccountType.INCOME;
            const delta = increaseIsDebit && movement.type === TransactionType_1.TransactionTypes.DEBIT
                ? movement.amount
                : increaseIsDebit && movement.type === TransactionType_1.TransactionTypes.CREDIT
                    ? -movement.amount
                    : increaseIsCredit && movement.type === TransactionType_1.TransactionTypes.CREDIT
                        ? movement.amount
                        : -movement.amount;
            effects.set(movement.accountCode, (effects.get(movement.accountCode) ?? 0) + delta);
            if (mutateMovements)
                movement.status = MovementStatus_1.MovementStatus.PROCESSED;
        }
        return effects;
    }
    async post(entry, previousEntry) {
        const accountCache = new Map();
        const previousEffects = previousEntry ? await this.computeEffects(previousEntry, accountCache, false) : new Map();
        const newEffects = await this.computeEffects(entry, accountCache, true);
        const accountCodes = new Set([...previousEffects.keys(), ...newEffects.keys()]);
        for (const accountCode of accountCodes) {
            const prev = previousEffects.get(accountCode) ?? 0;
            const next = newEffects.get(accountCode) ?? 0;
            const delta = next - prev;
            if (delta === 0)
                continue;
            try {
                await this.accounts.applyBalanceDelta(entry.companyId, accountCode, delta);
            }
            catch (error) {
                console.error(`Error aplicando delta ${delta} a cuenta ${accountCode}:`, error);
            }
        }
        await LedgerMovementModel_1.LedgerMovementMongoModel.deleteMany({ companyId: entry.companyId, journalEntryId: entry.id });
        for (const movement of entry.movements) {
            if (movement.status !== MovementStatus_1.MovementStatus.PROCESSED)
                continue;
            await LedgerMovementModel_1.LedgerMovementMongoModel.create({
                accountCode: movement.accountCode,
                debit: movement.type === TransactionType_1.TransactionTypes.DEBIT ? movement.amount : 0,
                credit: movement.type === TransactionType_1.TransactionTypes.CREDIT ? movement.amount : 0,
                date: entry.date,
                journalEntryId: entry.id,
                description: entry.description,
                companyId: entry.companyId,
                status: MovementStatus_1.MovementStatus.PROCESSED,
                periodId: entry.periodId,
            });
        }
    }
}
exports.MongoLedgerPoster = MongoLedgerPoster;
