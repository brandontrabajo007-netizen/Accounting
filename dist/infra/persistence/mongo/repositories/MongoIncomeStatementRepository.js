"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoIncomeStatementRepository = void 0;
const incomeStatementSnapshot_model_1 = require("../models/incomeStatementSnapshot.model");
/* ======================================================
   NORMALIZADOR (Mongo → Dominio)
====================================================== */
function normalizeSnapshot(doc) {
    return {
        id: doc._id.toString(), // ✔ conversión explícita y segura
        companyId: doc.companyId,
        period: {
            start: typeof doc.period.start === 'string' ? doc.period.start : doc.period.start.toISOString().slice(0, 10),
            end: typeof doc.period.end === 'string' ? doc.period.end : doc.period.end.toISOString().slice(0, 10),
        },
        sections: doc.sections,
        totals: doc.totals,
        generatedAt: doc.generatedAt,
    };
}
/* ======================================================
   REPOSITORIO
====================================================== */
class MongoIncomeStatementRepository {
    async save(snapshot) {
        await incomeStatementSnapshot_model_1.IncomeStatementSnapshotModel.create({
            companyId: snapshot.companyId,
            period: {
                start: new Date(`${snapshot.period.start}T00:00:00.000Z`),
                end: new Date(`${snapshot.period.end}T23:59:59.999Z`),
            },
            sections: snapshot.sections,
            totals: snapshot.totals,
            generatedAt: snapshot.generatedAt,
        });
    }
    async findByCompany(companyId) {
        const docs = await incomeStatementSnapshot_model_1.IncomeStatementSnapshotModel.find({ companyId }).sort({ generatedAt: -1 }).lean();
        return docs.map(normalizeSnapshot);
    }
    async findById(id) {
        const doc = await incomeStatementSnapshot_model_1.IncomeStatementSnapshotModel.findById(id).lean();
        if (!doc)
            return null;
        return normalizeSnapshot(doc);
    }
}
exports.MongoIncomeStatementRepository = MongoIncomeStatementRepository;
