"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePeriodAccessGuard = void 0;
const PeriodMustBeOpenPolicy_1 = require("@domain/accounting-periods/PeriodMustBeOpenPolicy");
const makePeriodAccessGuard = (periodRepo) => ({
    assertWritable: async (companyId, periodId) => {
        if (!periodId)
            return;
        const period = await periodRepo.findById(periodId);
        if (!period || period.companyId !== companyId) {
            throw new Error('Accounting period not found');
        }
        (0, PeriodMustBeOpenPolicy_1.ensurePeriodIsOpen)(period);
    },
});
exports.makePeriodAccessGuard = makePeriodAccessGuard;
