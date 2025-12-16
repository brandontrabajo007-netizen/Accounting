"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoLedgerBalanceRepository = void 0;
const LedgerBalanceModel_1 = require("../models/LedgerBalanceModel");
class MongoLedgerBalanceRepository {
    async get(companyId, accountCode) {
        const doc = await LedgerBalanceModel_1.LedgerBalanceMongoModel.findOne({ companyId, accountCode });
        return doc ? doc.balance : 0;
    }
    async update(companyId, accountCode, newBalance) {
        await LedgerBalanceModel_1.LedgerBalanceMongoModel.findOneAndUpdate({ companyId, accountCode }, { balance: newBalance }, { upsert: true });
    }
    // ✔ NUEVO: obtener todos los saldos de una empresa
    async getAllByCompany(companyId) {
        const docs = await LedgerBalanceModel_1.LedgerBalanceMongoModel.find({ companyId }).lean();
        return docs.map((d) => ({
            accountCode: d.accountCode,
            balance: d.balance,
        }));
    }
}
exports.MongoLedgerBalanceRepository = MongoLedgerBalanceRepository;
