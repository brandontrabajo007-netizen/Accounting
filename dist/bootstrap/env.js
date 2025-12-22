"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
/**
 * Este archivo SOLO se encarga de cargar las variables de entorno
 * ANTES de que cualquier otro módulo del sistema se ejecute.
 */
const NODE_ENV = process.env.NODE_ENV ?? 'development';
// Decidimos qué archivo cargar según el entorno
const envFile = NODE_ENV === 'production' ? '.env' : '.env.local';
// Cargamos el archivo de entorno
dotenv_1.default.config({
    path: node_path_1.default.resolve(process.cwd(), envFile),
});
// Logs temporales (se pueden quitar luego)
console.log('[bootstrap] NODE_ENV =', NODE_ENV);
console.log('[bootstrap] env file =', envFile);
console.log('[bootstrap] APP_URL =', process.env.APP_URL);
