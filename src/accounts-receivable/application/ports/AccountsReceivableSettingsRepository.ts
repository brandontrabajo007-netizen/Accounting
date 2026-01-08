import type { AccountsReceivableSettings } from '../../domain/AccountsReceivableSettings'

export interface AccountsReceivableSettingsRepository {
  getByCompanyId(companyId: string): Promise<AccountsReceivableSettings | null>
  save(settings: AccountsReceivableSettings): Promise<AccountsReceivableSettings>
}
