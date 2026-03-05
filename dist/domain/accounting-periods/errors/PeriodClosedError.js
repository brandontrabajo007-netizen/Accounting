"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePeriodClosedError = void 0;
const makePeriodClosedError = (periodId) => {
    const error = new Error(`Accounting period ${periodId} is closed. No modifications are allowed.`);
    error.name = 'PeriodClosedError';
    return error;
};
exports.makePeriodClosedError = makePeriodClosedError;
