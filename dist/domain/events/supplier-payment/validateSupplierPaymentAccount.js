"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSupplierPaymentAccount = void 0;
const AccountType_1 = require("@domain/accounts/AccountType");
const validateAccount_1 = require("@domain/accounts/validateAccount");
const validateSupplierPaymentAccount = (mapping, accountsCatalog) => {
    if (mapping.cashAccount)
        (0, validateAccount_1.validateAccount)('cashAccount', mapping.cashAccount, accountsCatalog, AccountType_1.AccountType.ASSET);
    if (mapping.bankAccount)
        (0, validateAccount_1.validateAccount)('bankAccount', mapping.bankAccount, accountsCatalog, AccountType_1.AccountType.ASSET);
    (0, validateAccount_1.validateAccount)('accountsPayableAccount', mapping.accountsPayableAccount, accountsCatalog, AccountType_1.AccountType.LIABILITY);
};
exports.validateSupplierPaymentAccount = validateSupplierPaymentAccount;
