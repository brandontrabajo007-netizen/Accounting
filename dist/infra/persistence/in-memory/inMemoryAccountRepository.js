"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeInMemoryAccountRepository = void 0;
const accountsCatalog_1 = require("./accountsCatalog");
const makeInMemoryAccountRepository = () => ({
    async getAll() {
        return accountsCatalog_1.accountsCatalog;
    },
    async getByCode(code) {
        const account = accountsCatalog_1.accountsCatalog.find((a) => a.code === code);
        if (!account)
            throw new Error(`Account ${code} not found`);
        return account;
    },
    async updateBalance(_accountCode, _newBalance) {
        // No-op for mock
    },
});
exports.makeInMemoryAccountRepository = makeInMemoryAccountRepository;
