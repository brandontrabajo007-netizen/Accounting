import { type Document, model, Schema } from 'mongoose'

export interface IncomeStatementSnapshotDocument extends Document {
  companyId: string

  period: {
    start: Date
    end: Date
  }

  sections: {
    name: string
    accounts: {
      code: number
      name: string
      total: number
    }[]
    total: number
  }[]

  totals: {
    grossProfit: number
    operatingIncome: number
    incomeBeforeTaxes: number
    netIncome?: number
  }

  generatedAt: Date
  createdAt: Date
  updatedAt: Date
}

const IncomeStatementSnapshotSchema = new Schema<IncomeStatementSnapshotDocument>(
  {
    companyId: { type: String, required: true, index: true },

    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },

    sections: [
      {
        name: { type: String, required: true },
        total: { type: Number, required: true },
        accounts: [
          {
            code: { type: Number, required: true },
            name: { type: String, required: true },
            total: { type: Number, required: true },
          },
        ],
      },
    ],

    totals: {
      grossProfit: { type: Number, required: true },
      operatingIncome: { type: Number, required: true },
      incomeBeforeTaxes: { type: Number, required: true },
      netIncome: { type: Number },
    },

    generatedAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

export const IncomeStatementSnapshotModel = model<IncomeStatementSnapshotDocument>('IncomeStatementSnapshot', IncomeStatementSnapshotSchema)
