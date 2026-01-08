import type { AccountsPayableSettings } from '../../domain/AccountsPayableSettings'

export interface AccountsPayableSettingsRepository {
  getByCompanyId(companyId: string): Promise<AccountsPayableSettings | null>
  save(settings: AccountsPayableSettings): Promise<AccountsPayableSettings>
}
