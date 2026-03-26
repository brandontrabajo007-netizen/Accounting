import { InvoiceIssuerSettingsMongoModel } from '../models/InvoiceIssuerSettingsModel'

export type InvoiceIssuerSettings = {
  companyId: string
  companyName?: string | null
  taxId?: string | null
  contactPhone?: string | null
  address?: string | null
  createdAt: Date
  updatedAt: Date
}

interface InvoiceIssuerSettingsDocument {
  companyId: string
  companyName?: string | null
  taxId?: string | null
  contactPhone?: string | null
  address?: string | null
  createdAt: Date
  updatedAt: Date
}

const toDomain = (doc: InvoiceIssuerSettingsDocument): InvoiceIssuerSettings => ({
  companyId: doc.companyId,
  companyName: doc.companyName ?? null,
  taxId: doc.taxId ?? null,
  contactPhone: doc.contactPhone ?? null,
  address: doc.address ?? null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
})

const normalizeOptionalString = (value?: string | null): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

export class MongoInvoiceIssuerSettingsRepository {
  async getByCompanyId(companyId: string): Promise<InvoiceIssuerSettings | null> {
    const doc = await InvoiceIssuerSettingsMongoModel.findOne({ companyId }).lean()
    return doc ? toDomain(doc) : null
  }

  async save(input: {
    companyId: string
    companyName?: string | null
    taxId?: string | null
    contactPhone?: string | null
    address?: string | null
  }): Promise<InvoiceIssuerSettings> {
    const doc = await InvoiceIssuerSettingsMongoModel.findOneAndUpdate(
      { companyId: input.companyId },
      {
        $set: {
          companyName: normalizeOptionalString(input.companyName),
          taxId: normalizeOptionalString(input.taxId),
          contactPhone: normalizeOptionalString(input.contactPhone),
          address: normalizeOptionalString(input.address),
        },
      },
      { upsert: true, new: true },
    ).lean()

    if (!doc) {
      return {
        companyId: input.companyId,
        companyName: input.companyName ?? null,
        taxId: input.taxId ?? null,
        contactPhone: input.contactPhone ?? null,
        address: input.address ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    return toDomain(doc)
  }
}

