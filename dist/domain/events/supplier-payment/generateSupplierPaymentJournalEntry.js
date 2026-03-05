"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSupplierPaymentJournalEntry = void 0;
const node_crypto_1 = require("node:crypto");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const getAccountName = (catalog, code) => catalog.find((a) => a.code === code)?.name ?? '';
const normalize = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
const chooseCashAccount = (paymentMethod, mapping) => {
    if (mapping.cashAccount && !mapping.bankAccount)
        return mapping.cashAccount;
    if (mapping.bankAccount && !mapping.cashAccount)
        return mapping.bankAccount;
    const normalized = paymentMethod ? normalize(paymentMethod) : '';
    if (normalized && /(banco|transferencia|transfer|tarjeta)/.test(normalized)) {
        return mapping.bankAccount ?? mapping.cashAccount;
    }
    return mapping.cashAccount ?? mapping.bankAccount;
};
const generateSupplierPaymentJournalEntry = (event, accounts, accountsCatalog) => {
    const amount = event.amount > 0 ? event.amount : 0;
    const cashAccount = chooseCashAccount(event.paymentMethod, accounts);
    if (!cashAccount) {
        throw new Error('No hay cuenta de caja o banco configurada para pagos a proveedores');
    }
    const movements = [
        {
            accountCode: accounts.accountsPayableAccount,
            accountName: getAccountName(accountsCatalog, accounts.accountsPayableAccount),
            type: TransactionType_1.TransactionTypes.DEBIT,
            amount,
            status: amount > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
            group: 'MAIN',
        },
        {
            accountCode: cashAccount,
            accountName: getAccountName(accountsCatalog, cashAccount),
            type: TransactionType_1.TransactionTypes.CREDIT,
            amount,
            status: amount > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
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
exports.generateSupplierPaymentJournalEntry = generateSupplierPaymentJournalEntry;
