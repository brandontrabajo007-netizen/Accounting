"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountModel = void 0;
const mongoose_1 = require("mongoose");
const accountSchema = new mongoose_1.Schema({
    code: { type: Number, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    nature: { type: String, required: true },
    // 👇 ESTA ES LA LÍNEA CORRECTA PARA UN MAP<string, number>
    currentBalanceByCompany: {
        type: Map,
        of: Number,
        default: {},
    },
}, { timestamps: true });
accountSchema.index({ code: 1 }, { unique: true });
exports.AccountModel = (0, mongoose_1.model)('Account', accountSchema);
