import type { User } from '@domain/users/User'

export interface UserRepository {
  create(data: Omit<User, 'id'>): Promise<User>
  findByTelegramId(telegramId: number): Promise<User | null>
  findById(id: string): Promise<User | null>
  findByPhone(phone: string): Promise<User | null>
  update(id: string, data: Partial<User>): Promise<User>
  delete(id: string): Promise<void>
  list(): Promise<User[]>
}
