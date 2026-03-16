"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoProductRepo = void 0;
const ProductModel_1 = require("../db/mongo/models/ProductModel");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Sku_1 = require("../../domain/value-objects/Sku");
function normalizeCostUnit(value) {
    if (typeof value === 'number')
        return value;
    if (value && typeof value === 'object' && 'amount' in value) {
        const amount = value.amount;
        return typeof amount === 'number' ? amount : 0;
    }
    return 0;
}
function toDomain(doc) {
    const costUnit = normalizeCostUnit(doc.costUnit);
    const saleUnit = normalizeCostUnit(doc.saleUnit ?? doc.costUnit);
    return {
        id: ProductId_1.ProductId.from(doc._id),
        companyId: doc.companyId,
        name: doc.name,
        sku: Sku_1.Sku.from(doc.sku),
        costUnit,
        saleUnit,
        active: doc.active,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
class MongoProductRepo {
    async getById(companyId, id) {
        const doc = await ProductModel_1.ProductModel.findOne({ _id: id, companyId }).lean().exec();
        return doc ? toDomain(doc) : null;
    }
    async getBySku(companyId, sku) {
        const doc = await ProductModel_1.ProductModel.findOne({ companyId, sku }).lean().exec();
        return doc ? toDomain(doc) : null;
    }
    async create(product) {
        await ProductModel_1.ProductModel.create({
            _id: product.id,
            companyId: product.companyId,
            name: product.name,
            sku: product.sku,
            costUnit: product.costUnit,
            saleUnit: product.saleUnit,
            active: product.active,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        });
    }
    async update(product) {
        await ProductModel_1.ProductModel.updateOne({ _id: product.id, companyId: product.companyId }, {
            $set: {
                name: product.name,
                sku: product.sku,
                costUnit: product.costUnit,
                saleUnit: product.saleUnit,
                active: product.active,
                updatedAt: product.updatedAt,
            },
        });
    }
    async list(query) {
        const filters = { companyId: query.companyId };
        if (query.q) {
            filters.$or = [{ name: { $regex: query.q, $options: 'i' } }, { sku: { $regex: query.q, $options: 'i' } }];
        }
        if (typeof query.active === 'boolean') {
            filters.active = query.active;
        }
        const skip = (query.page - 1) * query.pageSize;
        const [items, total] = await Promise.all([
            ProductModel_1.ProductModel.find(filters).skip(skip).limit(query.pageSize).lean().exec(),
            ProductModel_1.ProductModel.countDocuments(filters).exec(),
        ]);
        return { items: items.map(toDomain), total };
    }
}
exports.MongoProductRepo = MongoProductRepo;
