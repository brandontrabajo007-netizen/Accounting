"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPayrollAccountConfig = void 0;
const toPayrollAccountConfig = (doc) => ({
    companyId: doc.companyId,
    expenseAccount: doc.expenseAccount,
    cashAccount: doc.cashAccount,
    bankAccount: doc.bankAccount,
});
exports.toPayrollAccountConfig = toPayrollAccountConfig;
