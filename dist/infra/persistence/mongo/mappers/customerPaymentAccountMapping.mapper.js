"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoToCustomerPaymentAccountConfig = void 0;
const mongoToCustomerPaymentAccountConfig = (doc) => ({
    companyId: doc.companyId,
    cashAccount: doc.cashAccount ?? undefined,
    bankAccount: doc.bankAccount ?? undefined,
    accountsReceivableAccount: doc.accountsReceivableAccount,
});
exports.mongoToCustomerPaymentAccountConfig = mongoToCustomerPaymentAccountConfig;
