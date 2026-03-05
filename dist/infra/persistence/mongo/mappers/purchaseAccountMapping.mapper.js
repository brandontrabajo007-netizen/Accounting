"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPurchaseAccountMappingDocument = exports.toPurchaseAccountConfig = void 0;
const toPurchaseAccountConfig = (doc) => ({
    companyId: doc.companyId,
    vatAccount: doc.vatAccount ?? undefined,
    cashAccount: doc.cashAccount ?? undefined,
    bankAccount: doc.bankAccount ?? undefined,
    accountsPayableAccount: doc.accountsPayableAccount,
});
exports.toPurchaseAccountConfig = toPurchaseAccountConfig;
// Si en algún momento quieres guardar desde dominio → Mongo
const toPurchaseAccountMappingDocument = (config) => ({
    companyId: config.companyId,
    vatAccount: config.vatAccount,
    cashAccount: config.cashAccount,
    bankAccount: config.bankAccount,
    accountsPayableAccount: config.accountsPayableAccount,
});
exports.toPurchaseAccountMappingDocument = toPurchaseAccountMappingDocument;
