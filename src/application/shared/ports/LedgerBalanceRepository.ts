export interface LedgerBalanceRepository {
  get(companyId: string, accountCode: number): Promise<number>
  update(companyId: string, accountCode: number, newBalance: number): Promise<void>
  getAllByCompany(companyId: string): Promise<{ accountCode: number; balance: number }[]>
}
