"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoArEntryRepository = void 0;
const ArEntryModel_1 = require("../models/ArEntryModel");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    companyId: doc.companyId,
    customerId: doc.customerId,
    type: doc.type,
    amount: doc.amount,
    date: doc.date,
    source: doc.source,
    createdAt: doc.createdAt,
});
class MongoArEntryRepository {
    async add(entry) {
        const doc = await ArEntryModel_1.ArEntryMongoModel.create(entry);
        return toDomain(doc);
    }
    async listByCustomer(companyId, customerId) {
        const docs = await ArEntryModel_1.ArEntryMongoModel.find({ companyId, customerId }).sort({ date: 1, createdAt: 1, _id: 1 }).lean();
        return docs.map(toDomain);
    }
    async listBalancesByCompany(companyId) {
        const rows = await ArEntryModel_1.ArEntryMongoModel.aggregate([
            { $match: { companyId } },
            {
                $group: {
                    _id: '$customerId',
                    balance: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'debit'] }, '$amount', { $multiply: ['$amount', -1] }],
                        },
                    },
                },
            },
        ]);
        return rows.map((row) => ({
            customerId: String(row._id),
            balance: row.balance ?? 0,
        }));
    }
    async getBalanceByCustomer(companyId, customerId) {
        const [row] = await ArEntryModel_1.ArEntryMongoModel.aggregate([
            { $match: { companyId, customerId } },
            {
                $group: {
                    _id: null,
                    balance: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'debit'] }, '$amount', { $multiply: ['$amount', -1] }],
                        },
                    },
                },
            },
        ]);
        return row?.balance ?? 0;
    }
    async deleteByCustomer(companyId, customerId) {
        const result = await ArEntryModel_1.ArEntryMongoModel.deleteMany({ companyId, customerId });
        return result.deletedCount ?? 0;
    }
}
exports.MongoArEntryRepository = MongoArEntryRepository;
