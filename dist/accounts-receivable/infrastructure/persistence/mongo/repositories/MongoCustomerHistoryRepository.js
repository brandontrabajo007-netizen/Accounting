"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoCustomerHistoryRepository = void 0;
const CustomerHistoryModel_1 = require("../models/CustomerHistoryModel");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    companyId: doc.companyId,
    customerId: doc.customerId,
    type: doc.type,
    amount: doc.amount,
    date: doc.date,
    description: doc.description,
    paymentMethod: doc.paymentMethod,
    journalEntryId: doc.journalEntryId,
    createdAt: doc.createdAt,
});
class MongoCustomerHistoryRepository {
    async add(entry) {
        const doc = await CustomerHistoryModel_1.CustomerHistoryMongoModel.create(entry);
        return toDomain(doc);
    }
    async listByCustomer(companyId, customerId, params) {
        const page = params?.page && params.page > 0 ? params.page : 1;
        const limit = params?.limit && params.limit > 0 ? params.limit : 100;
        const skip = (page - 1) * limit;
        const sortDir = params?.sort === 'desc' ? -1 : 1;
        const filter = { companyId, customerId };
        if (params?.from || params?.to) {
            filter.date = {};
            if (params.from)
                filter.date.$gte = params.from;
            if (params.to)
                filter.date.$lte = params.to;
        }
        const [docs, total] = await Promise.all([
            CustomerHistoryModel_1.CustomerHistoryMongoModel.find(filter).sort({ date: sortDir, createdAt: sortDir, _id: sortDir }).skip(skip).limit(limit).lean(),
            CustomerHistoryModel_1.CustomerHistoryMongoModel.countDocuments(filter),
        ]);
        return { items: docs.map(toDomain), total };
    }
}
exports.MongoCustomerHistoryRepository = MongoCustomerHistoryRepository;
