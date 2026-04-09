"use strict";
// src/domain/events/sale/generateSaleJournalEntry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSaleJournalEntry = void 0;
const node_crypto_1 = require("node:crypto");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const VAT_RATE = 0.19;
const getAccountName = (catalog, code) => catalog.find((a) => a.code === code)?.name ?? '';
const normalize = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
const isCreditSale = (paymentMethod) => {
    if (!paymentMethod)
        return false;
    const normalized = normalize(paymentMethod);
    return /(credito|a credito|al credito)/.test(normalized);
};
const chooseLiquidAssetAccount = (paymentMethod, accounts) => {
    if (accounts.bankAccount && !accounts.cashAccount)
        return accounts.bankAccount;
    if (accounts.cashAccount && !accounts.bankAccount)
        return accounts.cashAccount;
    const normalized = paymentMethod ? normalize(paymentMethod) : '';
    if (normalized && /(banco|transferencia|transfer|tarjeta|nequi|daviplata|pse)/.test(normalized)) {
        return accounts.bankAccount ?? accounts.cashAccount;
    }
    return accounts.cashAccount ?? accounts.bankAccount ?? 0;
};
const generateSaleJournalEntry = (event, accounts, accountsCatalog) => {
    const totalAmount = event.totalAmount > 0 ? event.totalAmount : 0;
    const movements = [];
    // Entrada (caja / banco) o clientes (AR)
    const isCredit = isCreditSale(event.paymentMethod);
    const debitAccount = isCredit ? accounts.accountsReceivableAccount : chooseLiquidAssetAccount(event.paymentMethod, accounts);
    if (!debitAccount) {
        throw new Error(isCredit ? 'No hay cuenta de clientes configurada para ventas a credito' : 'No hay cuenta de caja o banco configurada para ventas');
    }
    movements.push({
        accountCode: debitAccount,
        accountName: getAccountName(accountsCatalog, debitAccount),
        type: TransactionType_1.TransactionTypes.DEBIT,
        amount: totalAmount,
        status: totalAmount > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
        group: 'REVENUE',
    });
    // IVA
    let vat = 0;
    let base = totalAmount;
    const vatAccount = accounts.vatAccount;
    if (event.includesVAT && totalAmount > 0) {
        base = Math.round(totalAmount / (1 + VAT_RATE));
        vat = totalAmount - base;
    }
    const vatStatus = vat > 0 ? MovementStatus_1.MovementStatus.PROCESSED : MovementStatus_1.MovementStatus.PROCESSED;
    movements.push({
        accountCode: vatAccount ?? 0,
        accountName: getAccountName(accountsCatalog, vatAccount ?? 0),
        type: TransactionType_1.TransactionTypes.CREDIT,
        amount: event.includesVAT ? vat : 0,
        status: vatStatus,
        group: 'REVENUE',
    });
    // Ingreso por ventas
    movements.push({
        accountCode: accounts.incomeAccount,
        accountName: getAccountName(accountsCatalog, accounts.incomeAccount),
        type: TransactionType_1.TransactionTypes.CREDIT,
        amount: base,
        status: base > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
        group: 'REVENUE',
    });
    // Costo de venta
    let cost = 0;
    if (event.includesCost && event.quantity && event.unitCost) {
        cost = event.quantity * event.unitCost;
    }
    movements.push({
        accountCode: accounts.cogsAccount ?? 0,
        accountName: getAccountName(accountsCatalog, accounts.cogsAccount ?? 0),
        type: TransactionType_1.TransactionTypes.DEBIT,
        amount: event.includesCost ? cost : 0,
        status: cost > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
        group: 'COST',
    });
    movements.push({
        accountCode: accounts.inventoryAccount ?? 0,
        accountName: getAccountName(accountsCatalog, accounts.inventoryAccount ?? 0),
        type: TransactionType_1.TransactionTypes.CREDIT,
        amount: event.includesCost ? cost : 0,
        status: cost > 0 ? MovementStatus_1.MovementStatus.CREATED : MovementStatus_1.MovementStatus.PENDING,
        group: 'COST',
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
exports.generateSaleJournalEntry = generateSaleJournalEntry;
