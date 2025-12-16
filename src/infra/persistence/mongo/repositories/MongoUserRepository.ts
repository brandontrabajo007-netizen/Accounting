import type { UserRepository } from '@application/shared/ports/UserRepository'
import type { User } from '@domain/users/User'
import { UserMongoModel } from '../models/UserModel'

export class MongoUserRepository implements UserRepository {
  async create(data: Omit<User, 'id'>): Promise<User> {
    const doc = await UserMongoModel.create(data)

    return {
      id: doc._id.toString(),
      telegramId: doc.telegramId,
      name: doc.name,
      companyId: doc.companyId,
      phone: doc.phone,
      password: doc.password,
    }
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    const doc = await UserMongoModel.findOne({ telegramId })
    if (!doc) return null

    return {
      id: doc._id.toString(),
      telegramId: doc.telegramId,
      name: doc.name,
      companyId: doc.companyId,
      phone: doc.phone,
      password: doc.password,
    }
  }

  // 👇 Necesario para login por ID o para generar token en Telegram
  async findById(id: string): Promise<User | null> {
    const doc = await UserMongoModel.findById(id)
    if (!doc) return null

    return {
      id: doc._id.toString(),
      telegramId: doc.telegramId,
      name: doc.name,
      companyId: doc.companyId,
      phone: doc.phone,
      password: doc.password,
    }
  }

  // 👇 NECESARIO para login con phone
  async findByPhone(phone: string): Promise<User | null> {
    const doc = await UserMongoModel.findOne({ phone })
    if (!doc) return null

    return {
      id: doc._id.toString(),
      telegramId: doc.telegramId,
      name: doc.name,
      companyId: doc.companyId,
      phone: doc.phone,
      password: doc.password,
    }
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const doc = await UserMongoModel.findByIdAndUpdate(id, data, {
      new: true,
    })

    if (!doc) {
      throw new Error('User not found')
    }

    return {
      id: doc._id.toString(),
      telegramId: doc.telegramId,
      name: doc.name,
      companyId: doc.companyId,
      phone: doc.phone,
      password: doc.password,
    }
  }

  async delete(id: string): Promise<void> {
    await UserMongoModel.findByIdAndDelete(id)
  }

  async list(): Promise<User[]> {
    const docs = await UserMongoModel.find()

    return docs.map((doc) => ({
      id: doc._id.toString(),
      telegramId: doc.telegramId,
      name: doc.name,
      companyId: doc.companyId,
      phone: doc.phone,
      // No retornamos password en list (no es necesario)
    }))
  }
}
