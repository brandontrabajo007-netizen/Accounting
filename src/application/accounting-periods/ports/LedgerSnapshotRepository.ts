import type { LedgerSnapshot } from '@domain/accounting-periods/snapshots/LedgerSnapshot'

export type LedgerSnapshotRepository = {
  save: (snapshot: LedgerSnapshot) => Promise<void>
  findLatestByCompany: (companyId: string) => Promise<LedgerSnapshot | null>
  findByPeriod: (companyId: string, periodId: string) => Promise<LedgerSnapshot | null>
}
