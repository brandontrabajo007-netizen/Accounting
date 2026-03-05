"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePurchaseJournalEntry = void 0;
const node_crypto_1 = require("node:crypto");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const VAT_RATE = 0.19;
const getAccountName = (catalog, code) => catalog.find((a) => a.code === code)?.name ?? '';
const generatePurchaseJournalEntry = (event, config, accountsCatalog) => {
    const movements = [];
    let base = event.amount > 0 ? event.amount : 0;
    let vat = 0;
    if (event.includesVAT && config.vatAccount && base > 0) {
        base = Math.round(event.amount / (1 + VAT_RATE));
        vat = event.amount - base;
    }
    movements.push({
        accountCode: event.debitAccount ?? 0,
        accountName: getAccountName(accountsCatalog, event.debitAccount ?? 0),
        type: TransactionType_1.TransactionTypes.DEBIT,
        amount: base,
        status: base > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
        group: 'MAIN',
    });
    if (config.vatAccount) {
        movements.push({
            accountCode: config.vatAccount,
            accountName: getAccountName(accountsCatalog, config.vatAccount),
            type: TransactionType_1.TransactionTypes.DEBIT,
            amount: vat,
            status: vat > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
            group: 'MAIN',
        });
    }
    let creditAccount;
    if (event.paymentMethod === 'cash')
        creditAccount = config.cashAccount;
    if (event.paymentMethod === 'bank')
        creditAccount = config.bankAccount;
    if (event.paymentMethod === 'credit')
        creditAccount = config.accountsPayableAccount;
    movements.push({
        accountCode: creditAccount ?? 0,
        accountName: getAccountName(accountsCatalog, creditAccount ?? 0),
        type: TransactionType_1.TransactionTypes.CREDIT,
        amount: event.amount ?? 0,
        status: event.amount > 0 && creditAccount ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
        group: 'MAIN',
    });
    return {
        id: (0, node_crypto_1.randomUUID)(),
        companyId: event.companyId,
        date: event.date,
        description: event.description,
        status: JournalEntryStatus_1.JournalEntryStatus.CREATED,
        movements,
    };
};
exports.generatePurchaseJournalEntry = generatePurchaseJournalEntry;
