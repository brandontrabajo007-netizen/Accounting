"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountsCatalog = void 0;
const AccountType_1 = require("@domain/accounts/AccountType");
exports.accountsCatalog = [
    { code: 1105, name: 'Caja general', type: AccountType_1.AccountType.ASSET, nature: 'debit', currentBalanceByCompany: {} },
    { code: 4101, name: 'Ingresos ventas', type: AccountType_1.AccountType.INCOME, nature: 'credit', currentBalanceByCompany: {} },
    { code: 2408, name: 'IVA por pagar', type: AccountType_1.AccountType.LIABILITY, nature: 'debit', currentBalanceByCompany: {} },
    { code: 6135, name: 'Costo ventas', type: AccountType_1.AccountType.EXPENSE, nature: 'debit', currentBalanceByCompany: {} },
    { code: 1435, name: 'Inventario mercancías', type: AccountType_1.AccountType.ASSET, nature: 'debit', currentBalanceByCompany: {} },
];
