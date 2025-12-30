import bcrypt from 'bcrypt'
import express from 'express'
import { userRepository } from '../dependencies'

const router = express.Router()

// --------------------------------------------
// Crear usuario (phone + password)
// --------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { phone, password, ...rest } = req.body

    // Validaciones básicas
    if (!phone) {
      return res.status(400).json({ error: 'phone es requerido' })
    }
    if (!password) {
      return res.status(400).json({ error: 'password es requerido' })
    }

    // Verificar que no exista otro usuario con el mismo teléfono
    const existing = await userRepository.findByPhone(phone)
    if (existing) {
      return res.status(409).json({ error: 'El teléfono ya está registrado' })
    }

    // Hashear password
    const hashed = await bcrypt.hash(password, 10)

    const user = await userRepository.create({
      ...rest,
      phone,
      password: hashed,
    })

    // Ocultar password en la respuesta
    const { password: _omit, ...safeUser } = user

    res.status(201).json(safeUser)
  } catch (err) {
    console.error('Error creando usuario:', err)
    res.status(500).json({ error: 'Error creando usuario' })
  }
})

// --------------------------------------------
// Listar usuarios (sin password)
// --------------------------------------------
router.get('/', async (_req, res) => {
  try {
    const users = await userRepository.list()

    // Remover password del response
    const safeUsers = users.map(({ password, ...u }) => u)

    res.json(safeUsers)
  } catch (err) {
    console.error('Error listando usuarios:', err)
    res.status(500).json({ error: 'Error listando usuarios' })
  }
})

// --------------------------------------------
//  Actualizar usuario (sin tocar password)
// --------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const { password, ...rest } = req.body

    // Por ahora, NO permitimos actualizar contraseña desde aquí
    if (password) {
      return res.status(400).json({ error: 'Use /auth/change-password para actualizar contraseña' })
    }

    const user = await userRepository.update(req.params.id, rest)

    const { password: _omit, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    console.error('Error actualizando usuario:', err)
    res.status(500).json({ error: 'Error actualizando usuario' })
  }
})

// --------------------------------------------
// Eliminar usuario
// --------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    await userRepository.delete(req.params.id)
    res.status(204).send()
  } catch (err) {
    console.error('Error eliminando usuario:', err)
    res.status(500).json({ error: 'Error eliminando usuario' })
  }
})

export { router as userRoutes }
