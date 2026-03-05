"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoToSupplierPaymentAccountConfig = void 0;
const mongoToSupplierPaymentAccountConfig = (doc) => ({
    companyId: doc.companyId,
    cashAccount: doc.cashAccount ?? undefined,
    bankAccount: doc.bankAccount ?? undefined,
    accountsPayableAccount: doc.accountsPayableAccount,
});
exports.mongoToSupplierPaymentAccountConfig = mongoToSupplierPaymentAccountConfig;
