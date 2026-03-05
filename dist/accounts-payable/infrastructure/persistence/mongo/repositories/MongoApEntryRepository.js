"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoApEntryRepository = void 0;
const ApEntryModel_1 = require("../models/ApEntryModel");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    companyId: doc.companyId,
    supplierId: doc.supplierId,
    type: doc.type,
    amount: doc.amount,
    date: doc.date,
    source: doc.source,
    createdAt: doc.createdAt,
});
class MongoApEntryRepository {
    async add(entry) {
        const doc = await ApEntryModel_1.ApEntryMongoModel.create(entry);
        return toDomain(doc);
    }
    async listBySupplier(companyId, supplierId) {
        const docs = await ApEntryModel_1.ApEntryMongoModel.find({ companyId, supplierId }).sort({ date: 1, createdAt: 1, _id: 1 }).lean();
        return docs.map(toDomain);
    }
    async listBalancesByCompany(companyId) {
        const rows = await ApEntryModel_1.ApEntryMongoModel.aggregate([
            { $match: { companyId } },
            {
                $group: {
                    _id: '$supplierId',
                    balance: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }],
                        },
                    },
                },
            },
        ]);
        return rows.map((row) => ({
            supplierId: String(row._id),
            balance: row.balance ?? 0,
        }));
    }
    async getBalanceBySupplier(companyId, supplierId) {
        const [row] = await ApEntryModel_1.ApEntryMongoModel.aggregate([
            { $match: { companyId, supplierId } },
            {
                $group: {
                    _id: null,
                    balance: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'credit'] }, '$amount', { $multiply: ['$amount', -1] }],
                        },
                    },
                },
            },
        ]);
        return row?.balance ?? 0;
    }
}
exports.MongoApEntryRepository = MongoApEntryRepository;
