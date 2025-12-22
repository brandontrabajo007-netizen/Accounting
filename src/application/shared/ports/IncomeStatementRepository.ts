import type { IncomeStatementSnapshot } from '@application/reports/types/IncomeStatementSnapshot'

export interface IncomeStatementRepository {
  save(snapshot: IncomeStatementSnapshot): Promise<void>
  findByCompany(companyId: string): Promise<IncomeStatementSnapshot[]>
  findById(id: string): Promise<IncomeStatementSnapshot | null> // 👈 NUEVO
}
