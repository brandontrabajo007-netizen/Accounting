"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoAccountRepository = void 0;
const account_mapper_1 = require("../mappers/account.mapper");
const account_model_1 = require("../models/account.model");
class MongoAccountRepository {
    async getAll() {
        const docs = await account_model_1.AccountModel.find();
        return docs.map(account_mapper_1.mongoToAccount);
    }
    async getByCode(code) {
        const doc = await account_model_1.AccountModel.findOne({ code });
        if (!doc) {
            throw new Error(`Account ${code} not found`);
        }
        return (0, account_mapper_1.mongoToAccount)(doc);
    }
    async getBalance(companyId, accountCode) {
        const doc = await account_model_1.AccountModel.findOne({ code: accountCode }, { currentBalanceByCompany: 1 });
        if (!doc) {
            throw new Error(`Account ${accountCode} not found`);
        }
        const balance = doc.currentBalanceByCompany?.get?.(companyId);
        return balance ?? 0;
    }
    async applyBalanceDelta(companyId, accountCode, delta) {
        const updated = await account_model_1.AccountModel.updateOne({ code: accountCode }, { $inc: { [`currentBalanceByCompany.${companyId}`]: delta } });
        if (updated.matchedCount === 0) {
            throw new Error(`Cannot update balance: account ${accountCode} not found`);
        }
    }
    async resetBalances(companyId, accountCodes) {
        const filter = accountCodes?.length ? { code: { $in: accountCodes } } : {};
        await account_model_1.AccountModel.updateMany(filter, { $set: { [`currentBalanceByCompany.${companyId}`]: 0 } });
    }
    async setBalance(companyId, accountCode, value) {
        const result = await account_model_1.AccountModel.updateOne({ code: accountCode }, { $set: { [`currentBalanceByCompany.${companyId}`]: value } });
        if (result.matchedCount === 0) {
            throw new Error(`Account ${accountCode} not found`);
        }
    }
}
exports.MongoAccountRepository = MongoAccountRepository;
