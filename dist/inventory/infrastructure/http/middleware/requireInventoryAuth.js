"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireInventoryAuth = requireInventoryAuth;
const auth_1 = require("@infra/http/middleware/auth");
function requireInventoryAuth(req, res, next) {
    (0, auth_1.authMiddleware)(req, res, () => {
        if (!req.user?.companyId) {
            return res.status(401).json({ ok: false, error: 'Usuario no autenticado o sin companyId' });
        }
        next();
    });
}
