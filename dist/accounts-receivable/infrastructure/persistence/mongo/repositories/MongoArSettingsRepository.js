"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoArSettingsRepository = void 0;
const ArSettingsModel_1 = require("../models/ArSettingsModel");
const toDomain = (doc) => ({
    companyId: doc.companyId,
    enabled: doc.enabled,
    defaultCreditWhenMissingPaymentMethod: doc.defaultCreditWhenMissingPaymentMethod,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});
class MongoArSettingsRepository {
    async getByCompanyId(companyId) {
        const doc = await ArSettingsModel_1.ArSettingsMongoModel.findOne({ companyId }).lean();
        return doc ? toDomain(doc) : null;
    }
    async save(settings) {
        const doc = await ArSettingsModel_1.ArSettingsMongoModel.findOneAndUpdate({ companyId: settings.companyId }, {
            $set: {
                enabled: settings.enabled,
                defaultCreditWhenMissingPaymentMethod: settings.defaultCreditWhenMissingPaymentMethod,
            },
        }, { upsert: true, new: true }).lean();
        if (!doc) {
            return {
                ...settings,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }
        return toDomain(doc);
    }
}
exports.MongoArSettingsRepository = MongoArSettingsRepository;
