"use strict";
// src/domain/journal-entries/helpers/generateSaleJournalEntry.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSaleJournalEntry = void 0;
const node_crypto_1 = require("node:crypto");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const VAT_RATE = 0.19;
const generateSaleJournalEntry = (event, accounts, accountsCatalog) => {
    const getAccountName = (code) => {
        const account = accountsCatalog.find((a) => a.code === code);
        if (!account)
            throw new Error(`Account with code ${code} not found in catalog`);
        return account.name;
    };
    if (event.totalAmount <= 0) {
        throw new Error('Total amount must be greater than zero');
    }
    const movements = [];
    // 1️ Entrada (caja / banco)
    movements.push({
        accountCode: accounts.cashAccount,
        accountName: getAccountName(accounts.cashAccount),
        type: TransactionType_1.TransactionTypes.DEBIT,
        amount: event.totalAmount,
        status: MovementStatus_1.MovementStatus.CREATED,
        group: 'REVENUE',
    });
    // 2️ IVA — siempre se genera el movimiento
    let vat = 0;
    let base = event.totalAmount;
    const vatAccount = accounts.vatAccount;
    if (!vatAccount && event.includesVAT) {
        throw new Error('VAT account not provided');
    }
    if (event.includesVAT) {
        base = Math.round(event.totalAmount / (1 + VAT_RATE));
        vat = event.totalAmount - base;
    }
    movements.push({
        accountCode: vatAccount ?? 0,
        accountName: getAccountName(vatAccount ?? 0),
        type: TransactionType_1.TransactionTypes.CREDIT,
        amount: event.includesVAT ? vat : 0,
        status: MovementStatus_1.MovementStatus.CREATED,
        group: 'REVENUE',
    });
    // 3️ Ingreso por ventas (siempre se genera)
    movements.push({
        accountCode: accounts.incomeAccount,
        accountName: getAccountName(accounts.incomeAccount),
        type: TransactionType_1.TransactionTypes.CREDIT,
        amount: base,
        status: MovementStatus_1.MovementStatus.CREATED,
        group: 'REVENUE',
    });
    // 4️ Costo de venta (siempre se genera)
    let cost = 0;
    if (!accounts.cogsAccount || !accounts.inventoryAccount) {
        if (event.includesCost) {
            throw new Error('Cost or inventory account not provided');
        }
    }
    if (event.includesCost) {
        if (!event.quantity || !event.unitCost)
            throw new Error('Quantity and unit cost must be provided');
        cost = event.quantity * event.unitCost;
    }
    movements.push({
        accountCode: accounts.cogsAccount ?? 0,
        accountName: getAccountName(accounts.cogsAccount ?? 0),
        type: TransactionType_1.TransactionTypes.DEBIT,
        amount: event.includesCost ? cost : 0,
        status: MovementStatus_1.MovementStatus.CREATED,
        group: 'COST',
    });
    movements.push({
        accountCode: accounts.inventoryAccount ?? 0,
        accountName: getAccountName(accounts.inventoryAccount ?? 0),
        type: TransactionType_1.TransactionTypes.CREDIT,
        amount: event.includesCost ? cost : 0,
        status: MovementStatus_1.MovementStatus.CREATED,
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
