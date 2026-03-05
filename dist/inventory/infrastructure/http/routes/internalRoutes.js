"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalRoutes = void 0;
const express_1 = __importDefault(require("express"));
const internalSalesCostController_1 = require("../controllers/internal/internalSalesCostController");
const internalSalesConfirmController_1 = require("../controllers/internal/internalSalesConfirmController");
const internalSalesReverseController_1 = require("../controllers/internal/internalSalesReverseController");
const requireInventoryAuth_1 = require("../middleware/requireInventoryAuth");
const router = express_1.default.Router();
exports.internalRoutes = router;
router.use(requireInventoryAuth_1.requireInventoryAuth);
router.post('/internal/sales/cost', internalSalesCostController_1.internalSaleCostHandler);
router.post('/internal/sales/confirm', internalSalesConfirmController_1.internalSaleConfirmHandler);
router.post('/internal/sales/reverse', internalSalesReverseController_1.internalSaleReverseHandler);
