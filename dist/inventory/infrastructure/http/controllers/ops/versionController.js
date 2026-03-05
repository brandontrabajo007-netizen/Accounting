"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryVersionHandler = inventoryVersionHandler;
const version = process.env.npm_package_version ?? 'unknown';
async function inventoryVersionHandler(_req, res) {
    return res.json({ version });
}
