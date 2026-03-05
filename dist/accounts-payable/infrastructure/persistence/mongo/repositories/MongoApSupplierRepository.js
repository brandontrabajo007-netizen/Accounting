"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoApSupplierRepository = void 0;
const ApSupplierModel_1 = require("../models/ApSupplierModel");
const toDomain = (doc) => ({
    id: doc._id.toString(),
    companyId: doc.companyId,
    name: doc.name,
    normalizedName: doc.normalizedName,
    createdAt: doc.createdAt,
});
class MongoApSupplierRepository {
    async findById(id) {
        const doc = await ApSupplierModel_1.ApSupplierMongoModel.findById(id).lean();
        return doc ? toDomain(doc) : null;
    }
    async findByNormalizedName(companyId, normalizedName) {
        const doc = await ApSupplierModel_1.ApSupplierMongoModel.findOne({ companyId, normalizedName }).lean();
        return doc ? toDomain(doc) : null;
    }
    async findByIds(ids) {
        if (ids.length === 0)
            return [];
        const docs = await ApSupplierModel_1.ApSupplierMongoModel.find({ _id: { $in: ids } }).lean();
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
            ApSupplierModel_1.ApSupplierMongoModel.find(filter).sort({ name: 1, _id: 1 }).skip(skip).limit(limit).lean(),
            ApSupplierModel_1.ApSupplierMongoModel.countDocuments(filter),
        ]);
        return { items: docs.map(toDomain), total };
    }
    async create(data) {
        const doc = await ApSupplierModel_1.ApSupplierMongoModel.create({
            companyId: data.companyId,
            name: data.name,
            normalizedName: data.normalizedName,
        });
        return toDomain(doc);
    }
}
exports.MongoApSupplierRepository = MongoApSupplierRepository;
