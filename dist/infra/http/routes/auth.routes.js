"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("@infra/security/jwt");
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = __importDefault(require("express"));
const dependencies_1 = require("../dependencies");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/login', async (req, res) => {
    try {
        // Normalizar teléfono
        const rawPhone = req.body.phone || '';
        const phone = rawPhone.trim().replace(/\s+/g, '');
        const password = req.body.password;
        console.log('Phone recibido:', rawPhone);
        console.log('Phone normalizado:', phone);
        if (!phone || !password) {
            return res.status(400).json({ error: 'phone y password son requeridos' });
        }
        const user = await dependencies_1.userRepository.findByPhone(phone);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (!user.password) {
            return res.status(500).json({ error: 'El usuario no tiene password configurada' });
        }
        const isValid = await bcrypt_1.default.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            companyId: user.companyId,
        });
        res.cookie('auth_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 1000 * 60 * 60 * 12,
        });
        const { password: _omit, ...safeUser } = user;
        return res.json({ status: true, token, user: safeUser });
    }
    catch (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ error: 'Error en servidor' });
    }
});
router.get('/me', auth_1.authMiddleware, (req, res) => {
    return res.json({
        user: req.user,
    });
});
router.post('/logout', (_req, res) => {
    res.clearCookie('auth_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
    });
    return res.json({ status: true, message: 'Sesión cerrada' });
});
exports.default = router;
