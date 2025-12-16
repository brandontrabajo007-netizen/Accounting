"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const router = express_1.default.Router();
exports.userRoutes = router;
// --------------------------------------------
// Crear usuario (phone + password)
// --------------------------------------------
router.post('/', async (req, res) => {
    try {
        const { phone, password, ...rest } = req.body;
        // Validaciones básicas
        if (!phone) {
            return res.status(400).json({ error: 'phone es requerido' });
        }
        if (!password) {
            return res.status(400).json({ error: 'password es requerido' });
        }
        // Verificar que no exista otro usuario con el mismo phone
        const existing = await dependencies_1.userRepository.findByPhone(phone);
        if (existing) {
            return res.status(409).json({ error: 'El phone ya está registrado' });
        }
        // Hashear password
        const hashed = await bcrypt_1.default.hash(password, 10);
        const user = await dependencies_1.userRepository.create({
            ...rest,
            phone,
            password: hashed,
        });
        // Ocultar password en la respuesta
        const { password: _omit, ...safeUser } = user;
        res.status(201).json(safeUser);
    }
    catch (err) {
        console.error('Error creando usuario:', err);
        res.status(500).json({ error: 'Error creando usuario' });
    }
});
// --------------------------------------------
// Listar usuarios (sin password)
// --------------------------------------------
router.get('/', async (_req, res) => {
    try {
        const users = await dependencies_1.userRepository.list();
        // Remover password del response
        const safeUsers = users.map(({ password, ...u }) => u);
        res.json(safeUsers);
    }
    catch (err) {
        console.error('Error listando usuarios:', err);
        res.status(500).json({ error: 'Error listando usuarios' });
    }
});
// --------------------------------------------
//  Actualizar usuario (sin tocar password)
// --------------------------------------------
router.put('/:id', async (req, res) => {
    try {
        const { password, ...rest } = req.body;
        // Por ahora, NO permitimos actualizar password desde aquí
        if (password) {
            return res.status(400).json({ error: 'Use /auth/change-password para actualizar contraseña' });
        }
        const user = await dependencies_1.userRepository.update(req.params.id, rest);
        const { password: _omit, ...safeUser } = user;
        res.json(safeUser);
    }
    catch (err) {
        console.error('Error actualizando usuario:', err);
        res.status(500).json({ error: 'Error actualizando usuario' });
    }
});
// --------------------------------------------
// Eliminar usuario
// --------------------------------------------
router.delete('/:id', async (req, res) => {
    try {
        await dependencies_1.userRepository.delete(req.params.id);
        res.status(204).send();
    }
    catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error eliminando usuario' });
    }
});
