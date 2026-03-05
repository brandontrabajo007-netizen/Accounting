"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeOpenAccountingPeriod = void 0;
const AccountingPeriodStatus_1 = require("@domain/accounting-periods/AccountingPeriodStatus");
const PeriodMustBeOpenPolicy_1 = require("@domain/accounting-periods/PeriodMustBeOpenPolicy");
const makeOpenAccountingPeriod = ({ accountingPeriodRepository }) => ({
    execute: async (companyId, periodId) => {
        const period = await accountingPeriodRepository.findById(periodId);
        if (!period || period.companyId !== companyId) {
            throw new Error('Accounting period not found');
        }
        // permitir reabrir CLOSED o abrir CREATED
        if (period.status !== AccountingPeriodStatus_1.AccountingPeriodStatus.CREATED && period.status !== AccountingPeriodStatus_1.AccountingPeriodStatus.CLOSED) {
            // ya está open
            (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(period);
            return period;
        }
        await accountingPeriodRepository.markOpenExclusive(companyId, periodId);
        const updated = await accountingPeriodRepository.findById(periodId);
        return updated ?? period;
    },
});
exports.makeOpenAccountingPeriod = makeOpenAccountingPeriod;
