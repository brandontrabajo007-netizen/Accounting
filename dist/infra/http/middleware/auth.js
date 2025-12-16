"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../../security/jwt");
const authMiddleware = (req, res, next) => {
    // 🔐 1. leer token desde cookie
    const token = req.cookies?.auth_token;
    if (!token) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    // 🔍 2. verificar JWT
    const decoded = (0, jwt_1.verifyToken)(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    // 👤 3. inyectar usuario
    req.user = decoded;
    next();
};
exports.authMiddleware = authMiddleware;
