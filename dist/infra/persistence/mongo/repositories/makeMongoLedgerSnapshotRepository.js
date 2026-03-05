"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMongoLedgerSnapshotRepository = void 0;
const ledgerSnapshot_model_1 = require("../models/ledgerSnapshot.model");
const toDomain = (doc) => ({
    id: doc.id,
    companyId: doc.companyId,
    periodId: doc.periodId,
    period: {
        start: new Date(doc.period.start),
        end: new Date(doc.period.end),
    },
    lines: doc.lines.map((l) => ({
        accountCode: l.accountCode,
        accountName: l.accountName,
        balance: l.balance,
    })),
    generatedAt: doc.generatedAt,
});
const makeMongoLedgerSnapshotRepository = () => ({
    save: async (snapshot) => {
        await ledgerSnapshot_model_1.LedgerSnapshotModel.updateOne({ companyId: snapshot.companyId, periodId: snapshot.periodId }, { $set: snapshot }, { upsert: true });
    },
    findLatestByCompany: async (companyId) => {
        const doc = await ledgerSnapshot_model_1.LedgerSnapshotModel.findOne({ companyId }).sort({ 'period.end': -1 }).lean();
        return doc ? toDomain(doc) : null;
    },
    findByPeriod: async (companyId, periodId) => {
        const doc = await ledgerSnapshot_model_1.LedgerSnapshotModel.findOne({ companyId, periodId }).lean();
        return doc ? toDomain(doc) : null;
    },
});
exports.makeMongoLedgerSnapshotRepository = makeMongoLedgerSnapshotRepository;
