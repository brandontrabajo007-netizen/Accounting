export type CostResponse = Readonly<{
  saleId: string
  costTotal: number
  breakdown: ReadonlyArray<{
    productId: string
    qty: number
    unitCost: number
    lineCost: number
  }>
}>
