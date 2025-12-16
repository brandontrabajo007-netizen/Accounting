"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_1 = require("@infra/persistence/mongo/connect");
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes")); // 👈 NUEVO
const journalEntry_routes_1 = require("./routes/journalEntry.routes");
const ledger_routes_1 = require("./routes/ledger.routes");
const payroll_routes_1 = require("./routes/payroll.routes");
const purchase_routes_1 = require("./routes/purchase.routes");
// Rutas
const reports_routes_1 = require("./routes/reports.routes");
const sale_routes_1 = require("./routes/sale.routes");
const telegram_routes_1 = require("./routes/telegram.routes");
const user_routes_1 = require("./routes/user.routes");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: 'http://localhost:5173',
    credentials: true, // <-- permite cookies
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json());
// Rutas HTTP
app.use('/', sale_routes_1.saleRoutes);
app.use('/reports', reports_routes_1.reportRoutes);
app.use('/users', user_routes_1.userRoutes);
app.use('/auth', auth_routes_1.default); // 👈 **AQUÍ SE ACTIVA LA RUTA**
app.use('/telegram', telegram_routes_1.telegramRoutes);
app.use('/ledger', ledger_routes_1.ledgerRoutes);
app.use('/', purchase_routes_1.purchaseRoutes);
app.use('/', payroll_routes_1.payrollRoutes);
app.use('/', journalEntry_routes_1.journalEntryRoutes);
(async () => {
    try {
        await (0, connect_1.connectToMongo)();
        const PORT = process.env.PORT ?? 3000;
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log('🟢 MongoDB Atlas conectado correctamente');
            console.log('🤖 Telegram webhook disponible en /telegram/webhook');
        });
    }
    catch (err) {
        console.error('🔴 No se pudo iniciar el servidor:', err);
        process.exit(1);
    }
})();
