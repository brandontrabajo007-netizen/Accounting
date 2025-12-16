import type { InferSchemaType } from 'mongoose'
import { model, Schema } from 'mongoose'

const accountSchema = new Schema(
  {
    code: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    nature: { type: String, required: true },

    // 👇 ESTA ES LA LÍNEA CORRECTA PARA UN MAP<string, number>
    currentBalanceByCompany: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
)

accountSchema.index({ code: 1 }, { unique: true })

export const AccountModel = model('Account', accountSchema)

// 🔥 Así Mongoose infiere correctamente el tipo Map<string, number>
export type AccountDocument = InferSchemaType<typeof accountSchema>
