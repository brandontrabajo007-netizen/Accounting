export interface Customer {
  id: string
  companyId: string
  name: string
  normalizedName: string
  documentNumber?: string | null
  phone?: string | null
  city?: string | null
  address?: string | null
  createdAt: Date
}
