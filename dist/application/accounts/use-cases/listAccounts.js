"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeListAccounts = void 0;
const makeListAccounts = ({ accountRepository }) => ({
    execute: async (companyId) => {
        const accounts = await accountRepository.getAll();
        return accounts.map((account) => ({
            code: account.code,
            name: account.name,
            type: account.type,
            nature: account.nature,
            balance: account.currentBalanceByCompany?.[companyId] ?? 0,
        }));
    },
});
exports.makeListAccounts = makeListAccounts;
