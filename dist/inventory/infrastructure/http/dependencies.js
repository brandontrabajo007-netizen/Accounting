"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInventorySettings = exports.getInventorySettings = exports.reverseSale = exports.confirmSale = exports.getSaleCost = exports.validateSaleCart = exports.registerAdjustment = exports.registerReceipt = exports.deleteVariant = exports.deactivateVariant = exports.updateVariant = exports.createVariant = exports.updateProduct = exports.createProduct = exports.idGenerator = exports.inventorySettingsRepo = exports.reservationRepo = exports.movementRepo = exports.variantRepo = exports.productRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MongoProductRepo_1 = require("../repositories/MongoProductRepo");
const MongoVariantRepo_1 = require("../repositories/MongoVariantRepo");
const MongoMovementRepo_1 = require("../repositories/MongoMovementRepo");
const MongoReservationRepo_1 = require("../repositories/MongoReservationRepo");
const MongoInventorySettingsRepo_1 = require("../repositories/MongoInventorySettingsRepo");
const createProduct_1 = require("../../application/use-cases/createProduct");
const updateProduct_1 = require("../../application/use-cases/updateProduct");
const createVariant_1 = require("../../application/use-cases/createVariant");
const updateVariant_1 = require("../../application/use-cases/updateVariant");
const deactivateVariant_1 = require("../../application/use-cases/deactivateVariant");
const deleteVariant_1 = require("../../application/use-cases/deleteVariant");
const registerReceipt_1 = require("../../application/use-cases/registerReceipt");
const registerAdjustment_1 = require("../../application/use-cases/registerAdjustment");
const validateSaleCart_1 = require("../../application/use-cases/validateSaleCart");
const getSaleCost_1 = require("../../application/use-cases/getSaleCost");
const confirmSale_1 = require("../../application/use-cases/confirmSale");
const reverseSale_1 = require("../../application/use-cases/reverseSale");
const getInventorySettings_1 = require("../../application/use-cases/getInventorySettings");
const updateInventorySettings_1 = require("../../application/use-cases/updateInventorySettings");
exports.productRepo = new MongoProductRepo_1.MongoProductRepo();
exports.variantRepo = new MongoVariantRepo_1.MongoVariantRepo();
exports.movementRepo = new MongoMovementRepo_1.MongoMovementRepo();
exports.reservationRepo = new MongoReservationRepo_1.MongoReservationRepo();
exports.inventorySettingsRepo = new MongoInventorySettingsRepo_1.MongoInventorySettingsRepo();
const idGenerator = () => new mongoose_1.default.Types.ObjectId().toHexString();
exports.idGenerator = idGenerator;
exports.createProduct = (0, createProduct_1.makeCreateProduct)({ productRepo: exports.productRepo, idGenerator: exports.idGenerator });
exports.updateProduct = (0, updateProduct_1.makeUpdateProduct)({ productRepo: exports.productRepo });
exports.createVariant = (0, createVariant_1.makeCreateVariant)({ variantRepo: exports.variantRepo, productRepo: exports.productRepo, inventorySettingsRepo: exports.inventorySettingsRepo, idGenerator: exports.idGenerator });
exports.updateVariant = (0, updateVariant_1.makeUpdateVariant)({ variantRepo: exports.variantRepo, inventorySettingsRepo: exports.inventorySettingsRepo });
exports.deactivateVariant = (0, deactivateVariant_1.makeDeactivateVariant)({ variantRepo: exports.variantRepo, inventorySettingsRepo: exports.inventorySettingsRepo });
exports.deleteVariant = (0, deleteVariant_1.makeDeleteVariant)({ variantRepo: exports.variantRepo, movementRepo: exports.movementRepo, inventorySettingsRepo: exports.inventorySettingsRepo });
exports.registerReceipt = (0, registerReceipt_1.makeRegisterReceipt)({
    productRepo: exports.productRepo,
    variantRepo: exports.variantRepo,
    movementRepo: exports.movementRepo,
    inventorySettingsRepo: exports.inventorySettingsRepo,
    idGenerator: exports.idGenerator,
});
exports.registerAdjustment = (0, registerAdjustment_1.makeRegisterAdjustment)({
    productRepo: exports.productRepo,
    variantRepo: exports.variantRepo,
    movementRepo: exports.movementRepo,
    inventorySettingsRepo: exports.inventorySettingsRepo,
    idGenerator: exports.idGenerator,
});
exports.validateSaleCart = (0, validateSaleCart_1.makeValidateSaleCart)({
    productRepo: exports.productRepo,
    variantRepo: exports.variantRepo,
    movementRepo: exports.movementRepo,
    reservationRepo: exports.reservationRepo,
    inventorySettingsRepo: exports.inventorySettingsRepo,
});
exports.getSaleCost = (0, getSaleCost_1.makeGetSaleCost)({ productRepo: exports.productRepo });
exports.confirmSale = (0, confirmSale_1.makeConfirmSale)({
    productRepo: exports.productRepo,
    variantRepo: exports.variantRepo,
    movementRepo: exports.movementRepo,
    reservationRepo: exports.reservationRepo,
    inventorySettingsRepo: exports.inventorySettingsRepo,
    idGenerator: exports.idGenerator,
});
exports.reverseSale = (0, reverseSale_1.makeReverseSale)({
    productRepo: exports.productRepo,
    variantRepo: exports.variantRepo,
    movementRepo: exports.movementRepo,
    inventorySettingsRepo: exports.inventorySettingsRepo,
    idGenerator: exports.idGenerator,
});
exports.getInventorySettings = (0, getInventorySettings_1.makeGetInventorySettings)({ inventorySettingsRepo: exports.inventorySettingsRepo });
exports.updateInventorySettings = (0, updateInventorySettings_1.makeUpdateInventorySettings)({
    inventorySettingsRepo: exports.inventorySettingsRepo,
    movementRepo: exports.movementRepo,
    reservationRepo: exports.reservationRepo,
    variantRepo: exports.variantRepo,
});
