"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoPeriodResultRepository = void 0;
const periodResult_model_1 = require("../models/periodResult.model");
const toDomain = (doc) => ({
    id: doc.id,
    companyId: doc.companyId,
    periodId: doc.periodId,
    period: {
        start: new Date(doc.period.start),
        end: new Date(doc.period.end),
    },
    incomeStatement: doc.incomeStatement,
    generatedAt: doc.generatedAt,
});
const makeMongoPeriodResultRepository = () => ({
    save: async (snapshot) => {
        await periodResult_model_1.PeriodResultModel.updateOne({ companyId: snapshot.companyId, periodId: snapshot.periodId }, { $set: snapshot }, { upsert: true });
    },
    findByPeriod: async (companyId, periodId) => {
        const doc = await periodResult_model_1.PeriodResultModel.findOne({ companyId, periodId }).lean();
        return doc ? toDomain(doc) : null;
    },
});
exports.makeMongoPeriodResultRepository = makeMongoPeriodResultRepository;
