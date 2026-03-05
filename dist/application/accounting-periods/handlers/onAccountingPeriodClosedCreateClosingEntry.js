"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOnAccountingPeriodClosedCreateClosingEntry = void 0;
const node_crypto_1 = require("node:crypto");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const AccountType_1 = require("@domain/accounts/AccountType");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const EventType_enum_1 = require("@domain/events/EventType.enum");
const makeOnAccountingPeriodClosedCreateClosingEntry = ({ journalEntryRepository, accountRepository, ledgerPoster, equityAccountCode, }) => {
    const handler = async (event) => {
        const typed = event;
        if (!typed || typed.type !== 'accounting.period.closed')
            return;
        const { companyId, periodId } = typed.payload;
        const existing = await journalEntryRepository.findByPeriodId(companyId, periodId);
        const previousClosingEntry = existing.find((e) => e.systemGenerated && e.periodId === periodId);
        const accounts = await accountRepository.getAll();
        const accountMap = new Map();
        accounts.forEach((a) => accountMap.set(a.code, a));
        // recomputar balances del periodo usando asientos (sin el asiento de cierre previo)
        const periodEntries = existing.filter((e) => e.eventType !== EventType_enum_1.EventType.CLOSING);
        const balanceByAccount = new Map();
        const increaseIsDebit = (accountType) => accountType === AccountType_1.AccountType.ASSET || accountType === AccountType_1.AccountType.EXPENSE;
        const increaseIsCredit = (accountType) => accountType === AccountType_1.AccountType.LIABILITY || accountType === AccountType_1.AccountType.EQUITY || accountType === AccountType_1.AccountType.INCOME;
        for (const entry of periodEntries) {
            for (const movement of entry.movements) {
                if (movement.status !== MovementStatus_1.MovementStatus.PROCESSED)
                    continue;
                const account = accountMap.get(movement.accountCode);
                if (!account)
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
        const movements = [];
        let totalIncome = 0;
        let totalExpense = 0;
        for (const account of accounts) {
            if (account.type !== AccountType_1.AccountType.INCOME && account.type !== AccountType_1.AccountType.EXPENSE)
                continue;
            const balance = balanceByAccount.get(account.code) ?? 0;
            if (balance === 0)
                continue;
            if (account.type === AccountType_1.AccountType.INCOME) {
                totalIncome += balance;
                movements.push({
                    accountCode: account.code,
                    accountName: account.name,
                    type: balance >= 0 ? TransactionType_1.TransactionTypes.DEBIT : TransactionType_1.TransactionTypes.CREDIT,
                    amount: Math.abs(balance),
                    status: MovementStatus_1.MovementStatus.PROCESSED,
                    group: 'MAIN',
                });
            }
            if (account.type === AccountType_1.AccountType.EXPENSE) {
                totalExpense += balance;
                movements.push({
                    accountCode: account.code,
                    accountName: account.name,
                    type: balance >= 0 ? TransactionType_1.TransactionTypes.CREDIT : TransactionType_1.TransactionTypes.DEBIT,
                    amount: Math.abs(balance),
                    status: MovementStatus_1.MovementStatus.PROCESSED,
                    group: 'MAIN',
                });
            }
        }
        const netResult = totalIncome - totalExpense;
        if (netResult !== 0) {
            const equityAccount = accounts.find((a) => a.code === equityAccountCode);
            if (!equityAccount) {
                throw new Error(`Equity account ${equityAccountCode} not found for closing entry`);
            }
            movements.push({
                accountCode: equityAccount.code,
                accountName: equityAccount.name,
                type: netResult > 0 ? TransactionType_1.TransactionTypes.CREDIT : TransactionType_1.TransactionTypes.DEBIT,
                amount: Math.abs(netResult),
                status: MovementStatus_1.MovementStatus.PROCESSED,
                group: 'MAIN',
            });
        }
        if (movements.length === 0 && !previousClosingEntry)
            return;
        const entry = {
            id: previousClosingEntry?.id ?? (0, node_crypto_1.randomUUID)(),
            companyId,
            periodId,
            date: previousClosingEntry?.date ?? new Date(),
            description: 'Asiento de cierre del periodo',
            status: JournalEntryStatus_1.JournalEntryStatus.PROCESSED,
            movements,
            systemGenerated: true,
            eventType: EventType_enum_1.EventType.CLOSING,
        };
        await journalEntryRepository.save(entry);
        await ledgerPoster.post(entry, previousClosingEntry ?? null);
    };
    return handler;
};
exports.makeOnAccountingPeriodClosedCreateClosingEntry = makeOnAccountingPeriodClosedCreateClosingEntry;
