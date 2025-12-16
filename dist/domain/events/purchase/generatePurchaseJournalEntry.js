"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePurchaseJournalEntry = void 0;
const node_crypto_1 = require("node:crypto");
const JournalEntryStatus_1 = require("@domain/journal-entries/JournalEntryStatus");
const MovementStatus_1 = require("@domain/movements/MovementStatus");
const TransactionType_1 = require("@domain/movements/TransactionType");
const VAT_RATE = 0.19;
const generatePurchaseJournalEntry = (event, config, accountsCatalog) => {
    const getAccountName = (code) => {
        const account = accountsCatalog.find((a) => a.code === code);
        if (!account)
            throw new Error(`Account with code ${code} not found in catalog`);
        return account.name;
    };
    const movements = [];
    // ▶ Calcular base e IVA
    let base = event.amount;
    let vat = 0;
    if (event.includesVAT && config.vatAccount) {
        base = Math.round(event.amount / (1 + VAT_RATE));
        vat = event.amount - base;
    }
    // ▶ 1. DEBE - Cuenta elegida por el usuario
    movements.push({
        accountCode: event.debitAccount,
        accountName: getAccountName(event.debitAccount),
        type: TransactionType_1.TransactionTypes.DEBIT,
        amount: base,
        status: MovementStatus_1.MovementStatus.CREATED,
        group: 'MAIN',
    });
    // ▶ 2. DEBE - IVA descontable (opcional)
    if (vat > 0 && config.vatAccount) {
        movements.push({
            accountCode: config.vatAccount,
            accountName: getAccountName(config.vatAccount),
            type: TransactionType_1.TransactionTypes.DEBIT,
            amount: vat,
            status: MovementStatus_1.MovementStatus.CREATED,
            group: 'MAIN',
        });
    }
    // ▶ 3. HABER - Método de pago
    const total = event.amount;
    let creditAccount;
    if (event.paymentMethod === 'cash')
        creditAccount = config.cashAccount;
    if (event.paymentMethod === 'bank')
        creditAccount = config.bankAccount;
    if (event.paymentMethod === 'credit')
        creditAccount = config.accountsPayableAccount;
    if (!creditAccount) {
        throw new Error('Missing credit account for payment method');
    }
    movements.push({
        accountCode: creditAccount,
        accountName: getAccountName(creditAccount),
        type: TransactionType_1.TransactionTypes.CREDIT,
        amount: total,
        status: MovementStatus_1.MovementStatus.CREATED,
        group: 'MAIN',
    });
    // ▶ Armar JournalEntry
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
