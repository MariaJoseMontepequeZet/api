import { describe, it } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../app.js";

async function login(username, password) {
    return request(app).post("/api/v1/users/authenticate").send({ username, password });
}

describe("POST /api/v1/users/authenticate", () => {
    it("credenciales correctas devuelven 200 y un JWT", async () => {
        const res = await login("satinder", "12345");
        assert.equal(res.status, 200);
        assert.ok(res.body.token);
    });

    it("credenciales incorrectas devuelven 401", async () => {
        const res = await login("satinder", "malapass");
        assert.equal(res.status, 401);
    });
});

describe("GET /api/v1/user/list", () => {
    it("con Bearer token devuelve 200", async () => {
        const { body } = await login("kael", "54321");
        const res = await request(app).get("/api/v1/user/list").set("Authorization", `Bearer ${body.token}`);
        assert.equal(res.status, 200);
        assert.equal(res.body.data.length, 3);
    });

    it("sin token devuelve 401", async () => {
        const res = await request(app).get("/api/v1/user/list");
        assert.equal(res.status, 401);
    });
});

describe("POST /api/v1/boveda/recompensa", () => {
    it("admin registra recompensa y devuelve 201", async () => {
        const { body } = await login("satinder", "12345");
        const res = await request(app).post("/api/v1/boveda/recompensa")
            .set("Authorization", `Bearer ${body.token}`)
            .send({ mision: "Dragón rojo", cristales: 500 });
        assert.equal(res.status, 201);
        assert.equal(res.body.data.mision, "Dragón rojo");
    });

    it("usuario sin admin devuelve 403", async () => {
        const { body } = await login("kael", "54321");
        const res = await request(app).post("/api/v1/boveda/recompensa")
            .set("Authorization", `Bearer ${body.token}`)
            .send({ mision: "Dragón rojo", cristales: 500 });
        assert.equal(res.status, 403);
    });
});
