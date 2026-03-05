"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoVariantRepo = void 0;
const VariantModel_1 = require("../db/mongo/models/VariantModel");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const VariantId_1 = require("../../domain/value-objects/VariantId");
const Sku_1 = require("../../domain/value-objects/Sku");
function toDomain(doc) {
    return {
        id: VariantId_1.VariantId.from(doc._id),
        companyId: doc.companyId,
        productId: ProductId_1.ProductId.from(doc.productId),
        attribute: doc.attribute,
        value: doc.value,
        skuVariant: doc.skuVariant ? Sku_1.Sku.from(doc.skuVariant) : undefined,
        active: doc.active,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
class MongoVariantRepo {
    async getById(companyId, id) {
        const doc = await VariantModel_1.VariantModel.findOne({ _id: id, companyId }).lean().exec();
        return doc ? toDomain(doc) : null;
    }
    async listByProductId(companyId, productId) {
        const docs = await VariantModel_1.VariantModel.find({ companyId, productId }).lean().exec();
        return docs.map(toDomain);
    }
    async getByProductAndAttributeValue(companyId, productId, attribute, value) {
        const doc = await VariantModel_1.VariantModel.findOne({ companyId, productId, attribute, value }).lean().exec();
        return doc ? toDomain(doc) : null;
    }
    async create(variant) {
        await VariantModel_1.VariantModel.create({
            _id: variant.id,
            companyId: variant.companyId,
            productId: variant.productId,
            attribute: variant.attribute,
            value: variant.value,
            skuVariant: variant.skuVariant,
            active: variant.active,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
        });
    }
    async update(variant) {
        await VariantModel_1.VariantModel.updateOne({ _id: variant.id, companyId: variant.companyId }, {
            $set: {
                attribute: variant.attribute,
                value: variant.value,
                skuVariant: variant.skuVariant,
                active: variant.active,
                updatedAt: variant.updatedAt,
            },
        });
    }
    async deactivate(companyId, variantId) {
        await VariantModel_1.VariantModel.updateOne({ _id: variantId, companyId }, {
            $set: {
                active: false,
                updatedAt: new Date(),
            },
        });
    }
    async delete(companyId, variantId) {
        await VariantModel_1.VariantModel.deleteOne({ _id: variantId, companyId });
    }
}
exports.MongoVariantRepo = MongoVariantRepo;
