"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeInMemorySaleAccountMappingRepository = void 0;
const saleAccountMapping_1 = require("./saleAccountMapping");
const makeInMemorySaleAccountMappingRepository = () => ({
    async getSaleAccountMappingByCompanyId(_companyId) {
        return saleAccountMapping_1.saleAccountMapping;
    },
});
exports.makeInMemorySaleAccountMappingRepository = makeInMemorySaleAccountMappingRepository;
