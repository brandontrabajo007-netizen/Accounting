export type LedgerSnapshotLine = {
  accountCode: number
  accountName: string
  balance: number
}

export type LedgerSnapshot = {
  id: string
  companyId: string
  periodId: string
  period: {
    start: Date
    end: Date
  }
  lines: LedgerSnapshotLine[]
  generatedAt: Date
}
