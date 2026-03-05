"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCustomerName = void 0;
const normalizeCustomerName = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
exports.normalizeCustomerName = normalizeCustomerName;
