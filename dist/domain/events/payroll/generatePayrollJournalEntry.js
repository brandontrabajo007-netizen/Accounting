"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePayrollJournalEntry = void 0;
// src/domain/events/payroll/generatePayrollJournalEntry.ts
const node_crypto_1 = require("node:crypto");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const generatePayrollJournalEntry = (event, config, accountsCatalog) => {
    const getAccountName = (code) => {
        const account = accountsCatalog.find((a) => a.code === code);
        if (!account)
            throw new Error(`Account with code ${code} not found in catalog`);
        return account.name;
    };
    if (event.amount <= 0) {
        throw new Error('Amount must be greater than zero');
    }
    const creditAccountCode = event.paymentMethod === 'cash' ? config.cashAccount : config.bankAccount;
    const movements = [
        {
            accountCode: config.expenseAccount, // 5105
            accountName: getAccountName(config.expenseAccount),
            type: TransactionType_1.TransactionTypes.DEBIT,
            amount: event.amount,
            status: MovementStatus_1.MovementStatus.CREATED,
            group: 'MAIN',
        },
        {
            accountCode: creditAccountCode,
            accountName: getAccountName(creditAccountCode),
            type: TransactionType_1.TransactionTypes.CREDIT,
            amount: event.amount,
            status: MovementStatus_1.MovementStatus.CREATED,
            group: 'MAIN',
        },
    ];
    return {
        id: (0, node_crypto_1.randomUUID)(),
        companyId: event.companyId,
        date: event.date,
        description: event.description,
        status: JournalEntryStatus_1.JournalEntryStatus.CREATED, // igual que sales/purchase
        movements,
    };
};
exports.generatePayrollJournalEntry = generatePayrollJournalEntry;
