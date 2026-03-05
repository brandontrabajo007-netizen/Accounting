"use strict";
// src/domain/accounts/validation/validateAccount.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAccount = void 0;
/**
 * Valida que el código de cuenta exista en el catálogo
 * y que el tipo coincida con el esperado.
 *
 * @param key Nombre de la propiedad (ej: "cashAccount")
 * @param code Código de la cuenta contable
 * @param accountsCatalog Lista de cuentas disponibles
 * @param expectedType Tipo contable esperado
 */
const validateAccount = (key, code, accountsCatalog, expectedType) => {
    // Si la cuenta es opcional y no está definida, no validamos nada
    if (code === undefined)
        return;
    // Buscamos la cuenta en el catálogo
    const account = accountsCatalog.find((acc) => acc.code === code);
    if (!account) {
        throw new Error(`Account "${String(key)}" with code ${code} does not exist in the account catalog.`);
    }
    // Validamos tipo contable
    if (account.type !== expectedType) {
        throw new Error(`Account "${String(key)}" with code ${code} must be of type "${expectedType}", but is "${account.type}".`);
    }
};
exports.validateAccount = validateAccount;
