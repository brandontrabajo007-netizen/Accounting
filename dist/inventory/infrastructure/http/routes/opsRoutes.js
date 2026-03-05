"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.opsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const healthController_1 = require("../controllers/ops/healthController");
const versionController_1 = require("../controllers/ops/versionController");
const router = express_1.default.Router();
exports.opsRoutes = router;
router.get('/health', healthController_1.inventoryHealthHandler);
router.get('/version', versionController_1.inventoryVersionHandler);
