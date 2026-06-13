"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoMovementRepo = void 0;
const MovementModel_1 = require("../db/mongo/models/MovementModel");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const Quantity_1 = require("../../domain/value-objects/Quantity");
const VariantId_1 = require("../../domain/value-objects/VariantId");
function toDomain(doc) {
    if (doc.type === 'ADJUST') {
        return {
            id: doc._id,
            companyId: doc.companyId,
            productId: ProductId_1.ProductId.from(doc.productId),
            productNameSnapshot: doc.productNameSnapshot,
            productSkuSnapshot: doc.productSkuSnapshot,
            productDeleted: doc.productDeleted,
            variantId: VariantId_1.VariantId.from(doc.variantId),
            type: 'ADJUST',
            qtyDelta: doc.qtyDelta ?? 0,
            occurredAt: doc.occurredAt,
            reference: doc.reference,
            batchId: doc.batchId,
            note: doc.note,
            createdAt: doc.createdAt,
        };
    }
    return {
        id: doc._id,
        companyId: doc.companyId,
        productId: ProductId_1.ProductId.from(doc.productId),
        productNameSnapshot: doc.productNameSnapshot,
        productSkuSnapshot: doc.productSkuSnapshot,
        productDeleted: doc.productDeleted,
        variantId: VariantId_1.VariantId.from(doc.variantId),
        type: doc.type,
        qty: Quantity_1.Quantity.from(doc.qty ?? 0),
        occurredAt: doc.occurredAt,
        reference: doc.reference,
        batchId: doc.batchId,
        note: doc.note,
        createdAt: doc.createdAt,
    };
}
class MongoMovementRepo {
    async addMany(movements) {
        const docs = movements.map((m) => {
            if (m.type === 'ADJUST') {
                return {
                    _id: m.id,
                    companyId: m.companyId,
                    productId: m.productId,
                    productNameSnapshot: m.productNameSnapshot,
                    productSkuSnapshot: m.productSkuSnapshot,
                    productDeleted: m.productDeleted,
                    variantId: m.variantId,
                    type: m.type,
                    qtyDelta: m.qtyDelta,
                    occurredAt: m.occurredAt,
                    reference: m.reference,
                    batchId: m.batchId,
                    note: m.note,
                    createdAt: m.createdAt,
                };
            }
            return {
                _id: m.id,
                companyId: m.companyId,
                productId: m.productId,
                productNameSnapshot: m.productNameSnapshot,
                productSkuSnapshot: m.productSkuSnapshot,
                productDeleted: m.productDeleted,
                variantId: m.variantId,
                type: m.type,
                qty: m.qty,
                occurredAt: m.occurredAt,
                reference: m.reference,
                batchId: m.batchId,
                note: m.note,
                createdAt: m.createdAt,
            };
        });
        if (docs.length > 0) {
            await MovementModel_1.MovementModel.insertMany(docs, { ordered: true });
        }
    }
    async findByReference(companyId, referenceType, referenceId) {
        const docs = await MovementModel_1.MovementModel.find({
            companyId,
            'reference.type': referenceType,
            'reference.id': referenceId,
        })
            .lean()
            .exec();
        return docs.map(toDomain);
    }
    async list(query) {
        const filters = { companyId: query.companyId };
        if (query.productId) {
            filters.productId = query.productId;
        }
        if (query.variantId) {
            filters.variantId = query.variantId;
        }
        if (query.type) {
            filters.type = query.type;
        }
        if (query.from || query.to) {
            const occurredAt = {};
            if (query.from) {
                occurredAt.$gte = query.from;
            }
            if (query.to) {
                occurredAt.$lte = query.to;
            }
            filters.occurredAt = occurredAt;
        }
        const skip = (query.page - 1) * query.pageSize;
        const [items, total] = await Promise.all([
            MovementModel_1.MovementModel.find(filters).skip(skip).limit(query.pageSize).sort({ occurredAt: -1 }).lean().exec(),
            MovementModel_1.MovementModel.countDocuments(filters).exec(),
        ]);
        return { items: items.map(toDomain), total };
    }
    async listByProductAndVariant(companyId, productId, variantId) {
        const docs = await MovementModel_1.MovementModel.find({ companyId, productId, variantId }).lean().exec();
        return docs.map(toDomain);
    }
    async listByProduct(companyId, productId) {
        const docs = await MovementModel_1.MovementModel.find({ companyId, productId }).lean().exec();
        return docs.map(toDomain);
    }
    async listByVariant(companyId, variantId) {
        const docs = await MovementModel_1.MovementModel.find({ companyId, variantId }).lean().exec();
        return docs.map(toDomain);
    }
    async existsByProduct(companyId, productId) {
        const doc = await MovementModel_1.MovementModel.findOne({ companyId, productId }).select({ _id: 1 }).lean().exec();
        return !!doc;
    }
    async existsByVariant(companyId, variantId) {
        const doc = await MovementModel_1.MovementModel.findOne({ companyId, variantId }).select({ _id: 1 }).lean().exec();
        return !!doc;
    }
    async stampDeletedProductSnapshot(companyId, productId, snapshot) {
        await MovementModel_1.MovementModel.updateMany({ companyId, productId }, {
            $set: {
                productNameSnapshot: snapshot.name,
                productSkuSnapshot: snapshot.sku,
                productDeleted: true,
            },
        });
    }
    async existsForActiveProductsByCompany(companyId) {
        const doc = await MovementModel_1.MovementModel.findOne({
            companyId,
            productDeleted: { $ne: true },
        })
            .select({ _id: 1 })
            .lean()
            .exec();
        return Boolean(doc);
    }
}
exports.MongoMovementRepo = MongoMovementRepo;
