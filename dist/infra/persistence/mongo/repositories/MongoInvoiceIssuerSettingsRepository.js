"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoInvoiceIssuerSettingsRepository = void 0;
const InvoiceIssuerSettingsModel_1 = require("../models/InvoiceIssuerSettingsModel");
const toDomain = (doc) => ({
    companyId: doc.companyId,
    companyName: doc.companyName ?? null,
    taxId: doc.taxId ?? null,
    contactPhone: doc.contactPhone ?? null,
    address: doc.address ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});
const normalizeOptionalString = (value) => {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
};
class MongoInvoiceIssuerSettingsRepository {
    async getByCompanyId(companyId) {
        const doc = await InvoiceIssuerSettingsModel_1.InvoiceIssuerSettingsMongoModel.findOne({ companyId }).lean();
        return doc ? toDomain(doc) : null;
    }
    async save(input) {
        const doc = await InvoiceIssuerSettingsModel_1.InvoiceIssuerSettingsMongoModel.findOneAndUpdate({ companyId: input.companyId }, {
            $set: {
                companyName: normalizeOptionalString(input.companyName),
                taxId: normalizeOptionalString(input.taxId),
                contactPhone: normalizeOptionalString(input.contactPhone),
                address: normalizeOptionalString(input.address),
            },
        }, { upsert: true, new: true }).lean();
        if (!doc) {
            return {
                companyId: input.companyId,
                companyName: input.companyName ?? null,
                taxId: input.taxId ?? null,
                contactPhone: input.contactPhone ?? null,
                address: input.address ?? null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        return toDomain(doc);
    }
}
exports.MongoInvoiceIssuerSettingsRepository = MongoInvoiceIssuerSettingsRepository;
