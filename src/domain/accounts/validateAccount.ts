// src/domain/accounts/validation/validateAccount.ts

import type { Account } from './Account'
import type { AccountType } from './AccountType'

/**
 * Valida que el código de cuenta exista en el catálogo
 * y que el tipo coincida con el esperado.
 *
 * @param key Nombre de la propiedad (ej: "cashAccount")
 * @param code Código de la cuenta contable
 * @param accountsCatalog Lista de cuentas disponibles
 * @param expectedType Tipo contable esperado
 */
export const validateAccount = (key: string, code: number | undefined, accountsCatalog: Account[], expectedType: AccountType): void => {
  // Si la cuenta es opcional y no está definida, no validamos nada
  if (code === undefined) return

  // Buscamos la cuenta en el catálogo
  const account = accountsCatalog.find((acc) => acc.code === code)

  if (!account) {
    throw new Error(`Account "${String(key)}" with code ${code} does not exist in the account catalog.`)
  }

  // Validamos tipo contable
  if (account.type !== expectedType) {
    throw new Error(`Account "${String(key)}" with code ${code} must be of type "${expectedType}", but is "${account.type}".`)
  }
}
