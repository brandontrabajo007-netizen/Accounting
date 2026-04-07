"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoVariantRepo = void 0;
const VariantModel_1 = require("../db/mongo/models/VariantModel");
const ProductId_1 = require("../../domain/value-objects/ProductId");
const VariantId_1 = require("../../domain/value-objects/VariantId");
const Sku_1 = require("../../domain/value-objects/Sku");
const textCollator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
const normalizeText = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
const parseNumericVariantValue = (value) => {
    const cleaned = value.trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(cleaned))
        return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
};
const sizeRank = new Map([
    ['xxs', 1],
    ['xs', 2],
    ['s', 3],
    ['m', 4],
    ['l', 5],
    ['xl', 6],
    ['xxl', 7],
    ['2xl', 7],
    ['xxxl', 8],
    ['3xl', 8],
    ['xxxxl', 9],
    ['4xl', 9],
]);
const compareVariantDocs = (left, right) => {
    const leftAttr = normalizeText(left.attribute);
    const rightAttr = normalizeText(right.attribute);
    const attrOrder = textCollator.compare(leftAttr, rightAttr);
    if (attrOrder !== 0)
        return attrOrder;
    const isSizeAttribute = /\b(talla|size)\b/.test(leftAttr);
    if (isSizeAttribute) {
        const leftNumber = parseNumericVariantValue(left.value);
        const rightNumber = parseNumericVariantValue(right.value);
        if (leftNumber !== null && rightNumber !== null && leftNumber !== rightNumber) {
            return leftNumber - rightNumber;
        }
        if (leftNumber !== null && rightNumber === null)
            return -1;
        if (leftNumber === null && rightNumber !== null)
            return 1;
        const leftSizeToken = normalizeText(left.value).replace(/\s+/g, '');
        const rightSizeToken = normalizeText(right.value).replace(/\s+/g, '');
        const leftSizeRank = sizeRank.get(leftSizeToken);
        const rightSizeRank = sizeRank.get(rightSizeToken);
        if (leftSizeRank !== undefined && rightSizeRank !== undefined && leftSizeRank !== rightSizeRank) {
            return leftSizeRank - rightSizeRank;
        }
        if (leftSizeRank !== undefined && rightSizeRank === undefined)
            return -1;
        if (leftSizeRank === undefined && rightSizeRank !== undefined)
            return 1;
    }
    else {
        const createdOrder = left.createdAt.getTime() - right.createdAt.getTime();
        if (createdOrder !== 0)
            return createdOrder;
    }
    const valueOrder = textCollator.compare(left.value, right.value);
    if (valueOrder !== 0)
        return valueOrder;
    return textCollator.compare(left._id, right._id);
};
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
        const docs = (await VariantModel_1.VariantModel.find({ companyId, productId }).lean().exec());
        docs.sort(compareVariantDocs);
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
