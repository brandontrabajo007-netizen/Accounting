"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Result = void 0;
exports.Result = {
    ok(value) {
        return { ok: true, value };
    },
    err(error) {
        return { ok: false, error };
    },
};
