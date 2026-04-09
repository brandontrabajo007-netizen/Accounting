"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSaleAccount = void 0;
const AccountType_1 = require("@domain/accounts/AccountType");
const validateAccount_1 = require("@domain/accounts/validateAccount");
const validateSaleAccount = (mapping, accountsCatalog, event) => {
    const paymentMethod = event?.paymentMethod
        ? event.paymentMethod
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        : '';
    const isCredit = paymentMethod ? /(credito|a credito|al credito)/.test(paymentMethod) : false;
    if (isCredit) {
        (0, validateAccount_1.validateAccount)('accountsReceivableAccount', mapping.accountsReceivableAccount, accountsCatalog, AccountType_1.AccountType.ASSET);
    }
    else {
        (0, validateAccount_1.validateAccount)('cashAccount', mapping.cashAccount, accountsCatalog, AccountType_1.AccountType.ASSET);
    }
    if (mapping.bankAccount) {
        (0, validateAccount_1.validateAccount)('bankAccount', mapping.bankAccount, accountsCatalog, AccountType_1.AccountType.ASSET);
    }
    (0, validateAccount_1.validateAccount)('incomeAccount', mapping.incomeAccount, accountsCatalog, AccountType_1.AccountType.INCOME);
    (0, validateAccount_1.validateAccount)('vatAccount', mapping.vatAccount, accountsCatalog, AccountType_1.AccountType.LIABILITY);
    if (event?.includesCost) {
        if (mapping.cogsAccount)
            (0, validateAccount_1.validateAccount)('cogsAccount', mapping.cogsAccount, accountsCatalog, AccountType_1.AccountType.EXPENSE);
        if (mapping.inventoryAccount)
            (0, validateAccount_1.validateAccount)('inventoryAccount', mapping.inventoryAccount, accountsCatalog, AccountType_1.AccountType.ASSET);
    }
};
exports.validateSaleAccount = validateSaleAccount;
