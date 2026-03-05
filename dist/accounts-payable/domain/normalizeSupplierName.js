"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSupplierName = void 0;
const normalizeSupplierName = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
exports.normalizeSupplierName = normalizeSupplierName;
