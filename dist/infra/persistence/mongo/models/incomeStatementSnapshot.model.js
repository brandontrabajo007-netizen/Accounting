"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeStatementSnapshotModel = void 0;
const mongoose_1 = require("mongoose");
const IncomeStatementSnapshotSchema = new mongoose_1.Schema({
    companyId: { type: String, required: true, index: true },
    period: {
        start: { type: Date, required: true },
        end: { type: Date, required: true },
    },
    sections: [
        {
            name: { type: String, required: true },
            total: { type: Number, required: true },
            accounts: [
                {
                    code: { type: Number, required: true },
                    name: { type: String, required: true },
                    total: { type: Number, required: true },
                },
            ],
        },
    ],
    totals: {
        grossProfit: { type: Number, required: true },
        operatingIncome: { type: Number, required: true },
        incomeBeforeTaxes: { type: Number, required: true },
        netIncome: { type: Number },
    },
    generatedAt: { type: Date, required: true },
}, {
    timestamps: true,
    versionKey: false,
});
exports.IncomeStatementSnapshotModel = (0, mongoose_1.model)('IncomeStatementSnapshot', IncomeStatementSnapshotSchema);
