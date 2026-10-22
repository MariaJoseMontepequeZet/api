import passport from "passport";

import { CredencialesDTO } from "../dtos/cazador.dto.js";

export function autenticarLocal(req, res, next) {

    const dto = new CredencialesDTO(req.body);

    req.body.username = dto.username;

    req.body.password = dto.password;


    passport.authenticate("local", { session: false }, (err, cazador, info) => {

        if (err) return next(err);

        if (!cazador) return res.status(401).json({ error: info?.message || "Credenciales inválidas" });

        req.user = cazador;

        next();

    })(req, res, next);

}

export function autenticarJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {

        return res.status(401).json({ error: "Acceso denegado: debes enviar el header Authorization: Bearer [JWT Token]" });

    }


    passport.authenticate("jwt", { session: false }, (err, usuarioVerificado, info) => {

        if (err) return next(err);

        if (!usuarioVerificado) {

            return res.status(401).json({

                error: "Token JWT inválido, firma alterada o expirado",

                detalle: info?.message || "Fallo en la verificación criptográfica HMAC-SHA256",

            });

        }

        req.user = usuarioVerificado;

        next();
    })(req, res, next);

}


export function autorizarAdmin(req, res, next) {

    if (!req.user?.admin) {

        return res.status(403).json({

            error: "Prohibido (403): tu token es válido, pero necesitas reclamación admin: true para abrir la Bóveda Maestra",

            rangoActual: req.user?.rango ?? "desconocido",

        });

    }

    next();

}