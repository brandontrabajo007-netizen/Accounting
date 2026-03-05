"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jwt_1 = require("../../security/jwt");
const getBearerToken = (authorization) => {
    if (!authorization)
        return null;
    const [scheme, token, ...rest] = authorization.trim().split(/\s+/);
    if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
        return null;
    }
    return token;
};
const authMiddleware = (req, res, next) => {
    // 1) Authorization: Bearer <token> (server-to-server), 2) cookie (web)
    const token = getBearerToken(req.headers.authorization) ?? req.cookies?.auth_token;
    if (!token) {
        return res.status(401).json({ error: 'No autenticado' });
    }
    // Verificar JWT
    const decoded = (0, jwt_1.verifyToken)(token);
    if (!decoded) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    // Inyectar usuario
    req.user = decoded;
    next();
};
exports.authMiddleware = authMiddleware;
