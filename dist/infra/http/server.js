"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 👇 PRIMERA LÍNEA, OBLIGATORIA
require("@bootstrap/env");
const connect_1 = require("@infra/persistence/mongo/connect");
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const journalEntry_routes_1 = require("./routes/journalEntry.routes");
const ledger_routes_1 = require("./routes/ledger.routes");
const payroll_routes_1 = require("./routes/payroll.routes");
const purchase_routes_1 = require("./routes/purchase.routes");
const reports_routes_1 = require("./routes/reports.routes");
const sale_routes_1 = require("./routes/sale.routes");
const telegram_routes_1 = require("./routes/telegram.routes");
const user_routes_1 = require("./routes/user.routes");
const accountingPeriod_routes_1 = require("./routes/accountingPeriod.routes");
const account_routes_1 = require("./routes/account.routes");
const ar_routes_1 = require("./routes/ar.routes");
const ap_routes_1 = require("./routes/ap.routes");
const inventoryRoutes_1 = require("@inventory/infrastructure/http/routes/inventoryRoutes");
const ensureIndexes_1 = require("@inventory/infrastructure/db/mongo/indexes/ensureIndexes");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const allowedOrigins = new Set([
    ...(process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((o) => o.trim()),
    process.env.FRONTEND_URL ?? '',
    process.env.SIGNATURE_FRONTEND_URL ?? '',
].filter(Boolean));
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Requests sin origin (Postman, Telegram, server-to-server)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`CORS bloqueado para el origen: ${origin}`), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json());
// --------------------
// Rutas HTTP
// --------------------
app.use('/', sale_routes_1.saleRoutes);
app.use('/', accountingPeriod_routes_1.accountingPeriodRoutes);
app.use('/', account_routes_1.accountRoutes);
app.use('/reports', reports_routes_1.reportRoutes);
app.use('/users', user_routes_1.userRoutes);
app.use('/auth', auth_routes_1.default);
app.use('/telegram', telegram_routes_1.telegramRoutes);
app.use('/ledger', ledger_routes_1.ledgerRoutes);
app.use('/', purchase_routes_1.purchaseRoutes);
app.use('/', payroll_routes_1.payrollRoutes);
app.use('/', journalEntry_routes_1.journalEntryRoutes);
app.use('/', ar_routes_1.arRoutes);
app.use('/', ap_routes_1.apRoutes);
app.use('/api/inventory', inventoryRoutes_1.inventoryRoutes);
(async () => {
    try {
        await (0, connect_1.connectToMongo)();
        await (0, ensureIndexes_1.ensureInventoryIndexes)();
        const PORT = Number(process.env.PORT ?? 3000);
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log('🟢 MongoDB conectado correctamente');
            console.log('🤖 Telegram webhook disponible en /telegram/webhook');
        });
    }
    catch (err) {
        console.error('🔴 No se pudo iniciar el servidor:', err);
        process.exit(1);
    }
})();
