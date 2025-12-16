import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface UserDocument extends Document {
  telegramId: number
  name?: string
  companyId: string
  phone?: string
  password?: string
}

const UserSchema = new Schema<UserDocument>(
  {
    telegramId: { type: Number, required: true, unique: true },
    name: { type: String },
    companyId: { type: String, required: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String },
  },
  {
    timestamps: true,
  },
)

export const UserMongoModel: Model<UserDocument> = mongoose.models.User ?? mongoose.model<UserDocument>('User', UserSchema)
