"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSaleAccount = void 0;
const AccountType_1 = require("@domain/accounts/AccountType");
const validateAccount_1 = require("@domain/accounts/validateAccount");
const validateSaleAccount = (mapping, accountsCatalog, event) => {
    (0, validateAccount_1.validateAccount)('cashAccount', mapping.cashAccount, accountsCatalog, AccountType_1.AccountType.ASSET);
    (0, validateAccount_1.validateAccount)('incomeAccount', mapping.incomeAccount, accountsCatalog, AccountType_1.AccountType.INCOME);
    (0, validateAccount_1.validateAccount)('vatAccount', mapping.vatAccount, accountsCatalog, AccountType_1.AccountType.LIABILITY);
    if (event?.includesCost) {
        if (!mapping.cogsAccount)
            throw new Error('cogsAccount is required when includesCost = true');
        if (!mapping.inventoryAccount)
            throw new Error('inventoryAccount is required when includesCost = true');
        (0, validateAccount_1.validateAccount)('cogsAccount', mapping.cogsAccount, accountsCatalog, AccountType_1.AccountType.EXPENSE);
        (0, validateAccount_1.validateAccount)('inventoryAccount', mapping.inventoryAccount, accountsCatalog, AccountType_1.AccountType.ASSET);
        if (!event.quantity)
            throw new Error('quantity must be provided when includesCost = true');
        if (!event.unitCost)
            throw new Error('unitCost must be provided when includesCost = true');
    }
};
exports.validateSaleAccount = validateSaleAccount;
