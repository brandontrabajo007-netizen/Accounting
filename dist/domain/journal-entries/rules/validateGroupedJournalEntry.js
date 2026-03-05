"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateGroupedJournalEntry = validateGroupedJournalEntry;
function validateGroupedJournalEntry(movements) {
    const groups = {};
    for (const movement of movements) {
        if (!groups[movement.group]) {
            groups[movement.group] = [];
        }
        groups[movement.group].push(movement);
    }
    for (const [group, items] of Object.entries(groups)) {
        let debit = 0;
        let credit = 0;
        for (const item of items) {
            if (item.type === 'debit') {
                debit += item.amount;
            }
            else {
                credit += item.amount;
            }
        }
        // Using epsilon for potential floating point issues, though ints are preferred for money
        if (Math.abs(debit - credit) > 0.01) {
            throw new Error(`El bloque ${group} no cuadra: Debitos (${debit}) ≠ Creditos (${credit})`);
        }
        /* -----------------------------------------------------
           👮 Validar Coherencia de IVA (Regla Anti-Vivos)
           El usuario solicitó basar el cálculo en "Caja General" (Total Recibido).
           Usamos el Total Débitos del grupo (Caja, Bancos, CxC) para calcular
           el IVA implícito: (Total / 1.19) * 0.19
        ----------------------------------------------------- */
        const vatMovements = items.filter((m) => m.accountCode === 2408);
        // En el grupo REVENUE, los Débitos son la entrada de dinero (Caja/Bancos/CxC)
        const totalPayment = items.filter((m) => m.type === 'debit').reduce((sum, m) => sum + m.amount, 0);
        const totalVat = vatMovements.reduce((sum, m) => sum + m.amount, 0);
        if (totalVat > 0 && totalPayment > 0) {
            // Lógica Definitiva: El valor recibido YA INCLUYE IVA.
            // Base = Total / 1.19 (Redondeado)
            // IVA  = Total - Base
            const impliedBase = Math.round(totalPayment / 1.19);
            const expectedVat = totalPayment - impliedBase;
            const diff = Math.abs(totalVat - expectedVat);
            // Permitimos un margen de error de $5 pesos por temas de redondeo
            if (diff > 5) {
                throw new Error(`IVA Inconsistente en grupo ${group}: Recaudo de $${totalPayment} implica IVA de ~$${Math.round(expectedVat)}, pero se envió $${totalVat}.`);
            }
        }
    }
}
