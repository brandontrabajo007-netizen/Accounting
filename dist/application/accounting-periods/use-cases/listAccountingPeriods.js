"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeListAccountingPeriods = void 0;
const makeListAccountingPeriods = ({ accountingPeriodRepository }) => ({
    execute: async (companyId) => {
        return accountingPeriodRepository.findByCompany(companyId);
    },
});
exports.makeListAccountingPeriods = makeListAccountingPeriods;
