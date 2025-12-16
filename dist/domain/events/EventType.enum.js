"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = void 0;
// src/domain/events/EventType.enum.ts
var EventType;
(function (EventType) {
    EventType["SALE"] = "sale";
    EventType["PURCHASE"] = "purchase";
    EventType["PAYROLL"] = "payroll";
    // future: EXPENSE = 'expense',
})(EventType || (exports.EventType = EventType = {}));
