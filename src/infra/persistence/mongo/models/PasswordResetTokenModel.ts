import mongoose, { type Document, type Model, Schema } from 'mongoose'

interface PasswordResetTokenDocument extends Document {
  userId: string
  companyId: string
  tokenHash: string
  requestedByUserId?: string | null
  expiresAt: Date
  usedAt?: Date | null
}

const PasswordResetTokenSchema = new Schema<PasswordResetTokenDocument>(
  {
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    requestedByUserId: { type: String, required: false, default: null },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, required: false, default: null },
  },
  {
    timestamps: true,
    collection: 'password_reset_tokens',
  },
)

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
PasswordResetTokenSchema.index({ userId: 1, createdAt: -1 })

export const PasswordResetTokenMongoModel: Model<PasswordResetTokenDocument> =
  mongoose.models.PasswordResetToken ??
  mongoose.model<PasswordResetTokenDocument>('PasswordResetToken', PasswordResetTokenSchema)

