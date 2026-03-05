"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePeriodIsOpen = void 0;
const PeriodClosedError_1 = require("./errors/PeriodClosedError");
const AccountingPeriodStatus_1 = require("./AccountingPeriodStatus");
const ensurePeriodIsOpen = (period) => {
    if (!period)
        return;
    if (period.status === AccountingPeriodStatus_1.AccountingPeriodStatus.CLOSED) {
        throw (0, PeriodClosedError_1.makePeriodClosedError)(period.id);
    }
};
exports.ensurePeriodIsOpen = ensurePeriodIsOpen;
