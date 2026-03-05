"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogRoutes = void 0;
const express_1 = __importDefault(require("express"));
const catalogProductsController_1 = require("../controllers/catalog/catalogProductsController");
const salesValidationController_1 = require("../controllers/catalog/salesValidationController");
const reservationsController_1 = require("../controllers/catalog/reservationsController");
const router = express_1.default.Router();
exports.catalogRoutes = router;
router.get('/catalog/products', catalogProductsController_1.listCatalogProductsHandler);
router.get('/catalog/products/:productId', catalogProductsController_1.getCatalogProductHandler);
router.get('/catalog/products/:productId/availability', catalogProductsController_1.getCatalogAvailabilityHandler);
router.post('/sales/validate', salesValidationController_1.validateSaleHandler);
router.post('/reservations', reservationsController_1.createReservationHandler);
router.post('/reservations/:reservationId/confirm', reservationsController_1.confirmReservationHandler);
router.post('/reservations/:reservationId/cancel', reservationsController_1.cancelReservationHandler);
