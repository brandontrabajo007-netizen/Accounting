export type LedgerLine = {
  accountCode: number
  debit: number
  credit: number
}

export type Ledger = Record<number, LedgerLine>
