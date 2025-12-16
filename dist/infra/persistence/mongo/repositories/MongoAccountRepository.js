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
    async updateBalance(accountCode, newBalance) {
        const updated = await account_model_1.AccountModel.updateOne({ code: accountCode }, { $set: { currentBalance: newBalance } });
        if (updated.matchedCount === 0) {
            throw new Error(`Cannot update balance: account ${accountCode} not found`);
        }
    }
}
exports.MongoAccountRepository = MongoAccountRepository;
