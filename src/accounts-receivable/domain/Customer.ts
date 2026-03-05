export interface Customer {
  id: string
  companyId: string
  name: string
  normalizedName: string
  phone?: string | null
  city?: string | null
  address?: string | null
  createdAt: Date
}
