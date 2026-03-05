"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoSupplierHistoryRepository = void 0;
const SupplierHistoryModel_1 = require("../models/SupplierHistoryModel");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    companyId: doc.companyId,
    supplierId: doc.supplierId,
    type: doc.type,
    amount: doc.amount,
    date: doc.date,
    description: doc.description,
    paymentMethod: doc.paymentMethod,
    journalEntryId: doc.journalEntryId,
    createdAt: doc.createdAt,
});
class MongoSupplierHistoryRepository {
    async add(entry) {
        const doc = await SupplierHistoryModel_1.SupplierHistoryMongoModel.create(entry);
        return toDomain(doc);
    }
    async listBySupplier(companyId, supplierId, params) {
        const page = params?.page && params.page > 0 ? params.page : 1;
        const limit = params?.limit && params.limit > 0 ? params.limit : 100;
        const skip = (page - 1) * limit;
        const sortDir = params?.sort === 'desc' ? -1 : 1;
        const filter = { companyId, supplierId };
        if (params?.from || params?.to) {
            filter.date = {};
            if (params.from)
                filter.date.$gte = params.from;
            if (params.to)
                filter.date.$lte = params.to;
        }
        const [docs, total] = await Promise.all([
            SupplierHistoryModel_1.SupplierHistoryMongoModel.find(filter).sort({ date: sortDir, createdAt: sortDir, _id: sortDir }).skip(skip).limit(limit).lean(),
            SupplierHistoryModel_1.SupplierHistoryMongoModel.countDocuments(filter),
        ]);
        return { items: docs.map(toDomain), total };
    }
}
exports.MongoSupplierHistoryRepository = MongoSupplierHistoryRepository;
