"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeRegisterPayroll = void 0;
const EventType_enum_1 = require("@domain/events/EventType.enum");
const generatePayrollJournalEntry_1 = require("@domain/events/payroll/generatePayrollJournalEntry");
const validatePayrollAccount_1 = require("@domain/events/payroll/validatePayrollAccount");
const presentJournalEntry_1 = require("../../sales/presenters/presentJournalEntry");
const makeRegisterPayroll = ({ accountRepository, payrollAccountMappingRepository, journalEntryRepository, processJournalEntry }) => {
    const registerPayroll = async (input) => {
        const date = input.date ? new Date(input.date) : new Date();
        // 1️⃣ Catálogo contable completo
        const catalog = await accountRepository.getAll();
        // 2️⃣ Mapping de cuentas
        const mapping = await payrollAccountMappingRepository.getPayrollAccountMappingByCompanyId(input.companyId);
        // 3️⃣ Construir evento de dominio
        const payrollEvent = {
            type: EventType_enum_1.EventType.PAYROLL,
            companyId: input.companyId,
            description: input.description,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            beneficiary: input.beneficiary,
            date,
            toJournalEntry: (config) => (0, generatePayrollJournalEntry_1.generatePayrollJournalEntry)(payrollEvent, config, catalog),
        };
        // 4️⃣ Validación de cuentas
        (0, validatePayrollAccount_1.validatePayrollAccount)(mapping, catalog, payrollEvent);
        // 5️⃣ Generar asiento
        let journalEntry = (0, generatePayrollJournalEntry_1.generatePayrollJournalEntry)(payrollEvent, mapping, catalog);
        // 6️⃣ Guardar asiento
        await journalEntryRepository.save(journalEntry);
        // 7️⃣ Procesar movimientos
        journalEntry = await processJournalEntry.process(journalEntry.id);
        // 8️⃣ Presentar salida consistente
        return (0, presentJournalEntry_1.presentJournalEntry)(journalEntry, catalog);
    };
    return { registerPayroll };
};
exports.makeRegisterPayroll = makeRegisterPayroll;
