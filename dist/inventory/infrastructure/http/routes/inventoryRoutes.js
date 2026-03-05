"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const adminRoutes_1 = require("./adminRoutes");
const catalogRoutes_1 = require("./catalogRoutes");
const internalRoutes_1 = require("./internalRoutes");
const opsRoutes_1 = require("./opsRoutes");
const router = express_1.default.Router();
exports.inventoryRoutes = router;
router.use('/', adminRoutes_1.adminRoutes);
router.use('/', catalogRoutes_1.catalogRoutes);
router.use('/', internalRoutes_1.internalRoutes);
router.use('/', opsRoutes_1.opsRoutes);
