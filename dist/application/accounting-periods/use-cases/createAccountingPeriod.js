"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCreateAccountingPeriod = void 0;
const AccountingPeriodStatus_1 = require("@domain/accounting-periods/AccountingPeriodStatus");
const makeCreateAccountingPeriod = ({ accountingPeriodRepository }) => ({
    execute: async ({ companyId, startDate, endDate, name }) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new Error('startDate y endDate deben ser fechas válidas');
        }
        if (end < start) {
            throw new Error('endDate no puede ser anterior a startDate');
        }
        const existing = await accountingPeriodRepository.findByCompany(companyId);
        const overlaps = existing.find((p) => 
        // solape si inician antes del fin y terminan después del inicio
        p.start <= end && p.end >= start);
        if (overlaps) {
            throw new Error('El período se solapa con uno existente');
        }
        const period = {
            id: undefined,
            companyId,
            name,
            start,
            end,
            status: AccountingPeriodStatus_1.AccountingPeriodStatus.CREATED,
        };
        await accountingPeriodRepository.save(period);
        return period;
    },
});
exports.makeCreateAccountingPeriod = makeCreateAccountingPeriod;
