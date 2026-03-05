"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOnAccountingPeriodClosedCreateLedgerSnapshot = void 0;
const node_crypto_1 = require("node:crypto");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const AccountType_1 = require("@domain/accounts/AccountType");
const EventType_enum_1 = require("@domain/events/EventType.enum");
const makeOnAccountingPeriodClosedCreateLedgerSnapshot = ({ ledgerSnapshotRepository, accountRepository, accountingPeriodRepository, journalEntryRepository, }) => {
    const handler = async (event) => {
        const typed = event;
        if (!typed || typed.type !== 'accounting.period.closed')
            return;
        const { companyId, periodId } = typed.payload;
        const period = await accountingPeriodRepository.findById(periodId);
        if (!period) {
            throw new Error('Accounting period not found for snapshot');
        }
        const accounts = await accountRepository.getAll();
        const entries = await journalEntryRepository.findByPeriodId(companyId, periodId);
        const accountMap = new Map();
        accounts.forEach((a) => accountMap.set(a.code, a));
        const increaseIsDebit = (accountType) => accountType === AccountType_1.AccountType.ASSET || accountType === AccountType_1.AccountType.EXPENSE;
        const increaseIsCredit = (accountType) => accountType === AccountType_1.AccountType.LIABILITY || accountType === AccountType_1.AccountType.EQUITY || accountType === AccountType_1.AccountType.INCOME;
        const balanceByAccount = new Map();
        for (const entry of entries) {
            for (const movement of entry.movements) {
                if (movement.status !== MovementStatus_1.MovementStatus.PROCESSED)
                    continue;
                const account = accountMap.get(movement.accountCode);
                if (!account)
                    continue;
                // En asientos de cierre solo consideramos el impacto en patrimonio,
                // evitando que ingresos/gastos queden en cero en el snapshot.
                if (entry.eventType === EventType_enum_1.EventType.CLOSING && account.type !== AccountType_1.AccountType.EQUITY)
                    continue;
                const delta = increaseIsDebit(account.type) && movement.type === TransactionType_1.TransactionTypes.DEBIT
                    ? movement.amount
                    : increaseIsDebit(account.type) && movement.type === TransactionType_1.TransactionTypes.CREDIT
                        ? -movement.amount
                        : increaseIsCredit(account.type) && movement.type === TransactionType_1.TransactionTypes.CREDIT
                            ? movement.amount
                            : -movement.amount;
                balanceByAccount.set(movement.accountCode, (balanceByAccount.get(movement.accountCode) ?? 0) + delta);
            }
        }
        const lines = accounts.map((account) => ({
            accountCode: account.code,
            accountName: account.name,
            balance: balanceByAccount.get(account.code) ?? 0,
        }));
        const existing = await ledgerSnapshotRepository.findByPeriod(companyId, periodId);
        const snapshot = {
            id: existing?.id ?? (0, node_crypto_1.randomUUID)(),
            companyId,
            periodId,
            period: { start: period.start, end: period.end },
            lines,
            generatedAt: new Date(),
        };
        await ledgerSnapshotRepository.save(snapshot);
    };
    return handler;
};
exports.makeOnAccountingPeriodClosedCreateLedgerSnapshot = makeOnAccountingPeriodClosedCreateLedgerSnapshot;
