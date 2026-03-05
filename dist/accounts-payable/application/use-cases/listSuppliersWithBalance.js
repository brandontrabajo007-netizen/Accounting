"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeListSuppliersWithBalance = void 0;
const makeListSuppliersWithBalance = (deps) => {
    const listSuppliersWithBalance = async (input) => {
        const balances = await deps.apEntryRepository.listBalancesByCompany(input.companyId);
        const nonZero = balances.filter((item) => item.balance !== 0);
        if (nonZero.length === 0)
            return [];
        const suppliers = await deps.supplierRepository.findByIds(nonZero.map((item) => item.supplierId));
        const supplierMap = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
        return nonZero
            .map((item) => {
            const supplier = supplierMap.get(item.supplierId);
            if (!supplier)
                return null;
            return {
                supplier,
                balance: item.balance,
            };
        })
            .filter((item) => Boolean(item));
    };
    return { listSuppliersWithBalance };
};
exports.makeListSuppliersWithBalance = makeListSuppliersWithBalance;
