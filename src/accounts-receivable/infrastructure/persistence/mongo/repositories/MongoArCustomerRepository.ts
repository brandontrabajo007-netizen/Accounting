import type { CustomerRepository } from '../../../../application/ports/CustomerRepository'
import type { Customer } from '../../../../domain/Customer'
import { ArCustomerMongoModel } from '../models/ArCustomerModel'

interface ArCustomerDocument {
  _id: { toString(): string }
  companyId: string
  name: string
  normalizedName: string
  createdAt: Date
}

const toDomain = (doc: ArCustomerDocument): Customer => ({
  id: doc._id.toString(),
  companyId: doc.companyId,
  name: doc.name,
  normalizedName: doc.normalizedName,
  createdAt: doc.createdAt,
})

export class MongoArCustomerRepository implements CustomerRepository {
  async findById(id: string): Promise<Customer | null> {
    const doc = await ArCustomerMongoModel.findById(id).lean()
    return doc ? toDomain(doc) : null
  }

  async findByNormalizedName(companyId: string, normalizedName: string): Promise<Customer | null> {
    const doc = await ArCustomerMongoModel.findOne({ companyId, normalizedName }).lean()
    return doc ? toDomain(doc) : null
  }

  async findByIds(ids: string[]): Promise<Customer[]> {
    if (ids.length === 0) return []
    const docs = await ArCustomerMongoModel.find({ _id: { $in: ids } }).lean()
    return docs.map(toDomain)
  }

  async listByCompany(
    companyId: string,
    params?: { search?: string; page?: number; limit?: number },
  ): Promise<{ items: Customer[]; total: number }> {
    const page = params?.page && params.page > 0 ? params.page : 1
    const limit = params?.limit && params.limit > 0 ? params.limit : 50
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = { companyId }
    if (params?.search?.trim()) {
      const term = params.search.trim()
      filter.$or = [{ name: { $regex: term, $options: 'i' } }, { normalizedName: { $regex: term, $options: 'i' } }]
    }

    const [docs, total] = await Promise.all([
      ArCustomerMongoModel.find(filter).sort({ name: 1, _id: 1 }).skip(skip).limit(limit).lean(),
      ArCustomerMongoModel.countDocuments(filter),
    ])

    return { items: docs.map(toDomain), total }
  }

  async create(data: { companyId: string; name: string; normalizedName: string }): Promise<Customer> {
    const doc = await ArCustomerMongoModel.create({
      companyId: data.companyId,
      name: data.name,
      normalizedName: data.normalizedName,
    })
    return toDomain(doc)
  }
}
