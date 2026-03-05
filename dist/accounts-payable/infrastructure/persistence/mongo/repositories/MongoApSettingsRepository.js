"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoApSettingsRepository = void 0;
const ApSettingsModel_1 = require("../models/ApSettingsModel");
const toDomain = (doc) => ({
    companyId: doc.companyId,
    enabled: doc.enabled,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
});
class MongoApSettingsRepository {
    async getByCompanyId(companyId) {
        const doc = await ApSettingsModel_1.ApSettingsMongoModel.findOne({ companyId }).lean();
        return doc ? toDomain(doc) : null;
    }
    async save(settings) {
        const doc = await ApSettingsModel_1.ApSettingsMongoModel.findOneAndUpdate({ companyId: settings.companyId }, {
            $set: {
                enabled: settings.enabled,
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
exports.MongoApSettingsRepository = MongoApSettingsRepository;
