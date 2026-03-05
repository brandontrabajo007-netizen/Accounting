"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeListCustomersWithBalance = void 0;
const makeListCustomersWithBalance = (deps) => {
    const listCustomersWithBalance = async (input) => {
        const balances = await deps.arEntryRepository.listBalancesByCompany(input.companyId);
        const positive = balances.filter((item) => item.balance !== 0);
        if (positive.length === 0)
            return [];
        const customers = await deps.customerRepository.findByIds(positive.map((item) => item.customerId));
        const customerMap = new Map(customers.map((customer) => [customer.id, customer]));
        return positive
            .map((item) => {
            const customer = customerMap.get(item.customerId);
            if (!customer)
                return null;
            return {
                customer,
                balance: item.balance,
            };
        })
            .filter((item) => Boolean(item));
    };
    return { listCustomersWithBalance };
};
exports.makeListCustomersWithBalance = makeListCustomersWithBalance;
