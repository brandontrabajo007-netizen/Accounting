"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePayrollJournalEntry = void 0;
// src/domain/events/payroll/generatePayrollJournalEntry.ts
const node_crypto_1 = require("node:crypto");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const getAccountName = (catalog, code) => {
    if (!code)
        return '';
    return catalog.find((a) => a.code === code)?.name ?? '';
};
const generatePayrollJournalEntry = (event, config, accountsCatalog) => {
    const amount = event.amount > 0 ? event.amount : 0;
    const creditAccountCode = event.paymentMethod === 'cash' ? config.cashAccount : config.bankAccount;
    const movements = [
        {
            accountCode: config.expenseAccount ?? 0,
            accountName: getAccountName(accountsCatalog, config.expenseAccount),
            type: TransactionType_1.TransactionTypes.DEBIT,
            amount,
            status: amount > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
            group: 'MAIN',
        },
        {
            accountCode: creditAccountCode ?? 0,
            accountName: getAccountName(accountsCatalog, creditAccountCode),
            type: TransactionType_1.TransactionTypes.CREDIT,
            amount,
            status: amount > 0 && creditAccountCode ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
            group: 'MAIN',
        },
    ];
    return {
        id: (0, node_crypto_1.randomUUID)(),
        companyId: event.companyId,
        date: event.date,
        description: event.description,
        status: JournalEntryStatus_1.JournalEntryStatus.CREATED,
        movements,
    };
};
exports.generatePayrollJournalEntry = generatePayrollJournalEntry;
