"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJournalEntry = void 0;
const TransactionType_1 = require("../movements/TransactionType");
const validateJournalEntry = (entry) => {
    const totalDebits = entry.movements.filter((m) => m.type === TransactionType_1.TransactionTypes.DEBIT).reduce((sum, m) => sum + m.amount, 0);
    const totalCredits = entry.movements.filter((m) => m.type === TransactionType_1.TransactionTypes.CREDIT).reduce((sum, m) => sum + m.amount, 0);
    if (totalDebits !== totalCredits) {
        throw new Error(`Journal entry is unbalanced: debits=${totalDebits}, credits=${totalCredits}`);
    }
};
exports.validateJournalEntry = validateJournalEntry;
