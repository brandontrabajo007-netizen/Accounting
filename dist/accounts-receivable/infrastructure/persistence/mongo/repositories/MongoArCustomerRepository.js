"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoArCustomerRepository = void 0;
const ArCustomerModel_1 = require("../models/ArCustomerModel");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    companyId: doc.companyId,
    name: doc.name,
    normalizedName: doc.normalizedName,
    phone: doc.phone ?? null,
    city: doc.city ?? null,
    address: doc.address ?? null,
    createdAt: doc.createdAt,
});
class MongoArCustomerRepository {
    async findById(id) {
        const doc = await ArCustomerModel_1.ArCustomerMongoModel.findById(id).lean();
        return doc ? toDomain(doc) : null;
    }
    async findByNormalizedName(companyId, normalizedName) {
        const doc = await ArCustomerModel_1.ArCustomerMongoModel.findOne({ companyId, normalizedName }).lean();
        return doc ? toDomain(doc) : null;
    }
    async findByIds(ids) {
        if (ids.length === 0)
            return [];
        const docs = await ArCustomerModel_1.ArCustomerMongoModel.find({ _id: { $in: ids } }).lean();
        return docs.map(toDomain);
    }
    async listByCompany(companyId, params) {
        const page = params?.page && params.page > 0 ? params.page : 1;
        const limit = params?.limit && params.limit > 0 ? params.limit : 50;
        const skip = (page - 1) * limit;
        const filter = { companyId };
        if (params?.search?.trim()) {
            const term = params.search.trim();
            filter.$or = [{ name: { $regex: term, $options: 'i' } }, { normalizedName: { $regex: term, $options: 'i' } }];
        }
        const [docs, total] = await Promise.all([
            ArCustomerModel_1.ArCustomerMongoModel.find(filter).sort({ name: 1, _id: 1 }).skip(skip).limit(limit).lean(),
            ArCustomerModel_1.ArCustomerMongoModel.countDocuments(filter),
        ]);
        return { items: docs.map(toDomain), total };
    }
    async create(data) {
        const doc = await ArCustomerModel_1.ArCustomerMongoModel.create({
            companyId: data.companyId,
            name: data.name,
            normalizedName: data.normalizedName,
            phone: data.phone?.trim() || undefined,
            city: data.city?.trim() || undefined,
            address: data.address?.trim() || undefined,
        });
        return toDomain(doc);
    }
}
exports.MongoArCustomerRepository = MongoArCustomerRepository;
