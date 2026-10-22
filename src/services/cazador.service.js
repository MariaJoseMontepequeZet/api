import jwt from "jsonwebtoken";

import { CAZADORES_SEMILLA } from "../models/cazador.model.js";

import { PerfilCazadorDTO } from "../dtos/cazador.dto.js";


export const JWT_SECRET = process.env.JWT_SECRET || "campuslands_secret_key_256_bits";

export const JWT_EXPIRES_IN = "2h";

const recompensasMemoria = [];

export const cazadorService = {

    async buscarPorUsername(username) {

        const limpio = String(username ?? "").trim().toLowerCase();

        return CAZADORES_SEMILLA.find((c) => c.username === limpio) || null;

    },

    async buscarPorSub(sub) {

        return CAZADORES_SEMILLA.find((c) => c.sub === String(sub)) || null;

    },

    async listarPerfiles() {

        return CAZADORES_SEMILLA.map((c) => new PerfilCazadorDTO(c));

    },

    firmarTokenJWT(cazador) {

        const payload = {

            sub: cazador.sub, // Claim registrada: sujeto único

            username: cazador.username,

            name: cazador.name, // Claim pública

            rango: cazador.rango, // Claim privada personalizada

            admin: Boolean(cazador.admin), // Claim privada de autorización

        };

        return jwt.sign(payload, JWT_SECRET, { algorithm: "HS256", expiresIn: JWT_EXPIRES_IN });

    },

    async crearRecompensa(datos, adminUsername) {

        const nueva = { id: `bov-${Date.now()}`, ...datos, autorizadoPor: adminUsername, createdAt: new Date().toISOString() };

        recompensasMemoria.unshift(nueva);

        return nueva;
    },
};