# API JWT + Passport - Gremio de Cazadores

API REST hecha con Express para practicar autenticación con **JWT** y **Passport.js**. Los cazadores del gremio inician sesión, reciben un token y con ese token pueden ver la lista de cazadores. Solo los cazadores con rol de administrador pueden registrar recompensas en la Bóveda Maestra.

Proyecto de repaso del módulo de Express en Campuslands (Auth Lab 03: JWT y Passport.js).

## Tabla de contenidos

- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts](#scripts)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura y flujo de una petición](#arquitectura-y-flujo-de-una-petición)
- [Endpoints](#endpoints)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Ejemplos de uso](#ejemplos-de-uso)
- [Códigos de respuesta](#códigos-de-respuesta)
- [Pruebas](#pruebas)
- [Flujo de trabajo con Git](#flujo-de-trabajo-con-git)
- [Pendientes y mejoras](#pendientes-y-mejoras)
- [Autoría](#autoría)

## Tecnologías

| Paquete | Versión | Para qué se usa |
|---|---|---|
| express | 5.x | Servidor y rutas de la API |
| cors | 2.x | Permitir peticiones desde otros orígenes |
| passport | 0.7.x | Manejo de estrategias de autenticación |
| passport-local | 1.x | Login con username y password |
| passport-jwt | 4.x | Validar el Bearer token en rutas protegidas |
| jsonwebtoken | 9.x | Firmar los tokens JWT (HS256) |
| express-validator | 7.x | Validar el body de las peticiones |
| mongoose | 9.x | Definir el modelo `Cazador` |
| supertest (dev) | 7.x | Hacer peticiones HTTP en las pruebas |

Las pruebas usan `node:test`, el test runner que ya viene incluido en Node.js, así que no se necesita Jest ni Mocha.

## Requisitos

- Node.js 22 o superior (probado con Node 24)
- npm

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/MariaJoseMontepequeZet/api.git
cd api
```

2. Instalar las dependencias:

```bash
npm install
```

Si se quieren instalar una por una:

```bash
npm install express cors passport passport-local passport-jwt jsonwebtoken express-validator mongoose
npm install -D supertest
```

3. Crear el archivo `.env` a partir del ejemplo (opcional, ver la siguiente sección):

```bash
cp .env.example .env
```

4. Levantar el servidor:

```bash
npm run dev
```

La API queda disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `PORT` | Puerto donde se levanta el servidor | `3000` |
| `JWT_SECRET` | Clave secreta para firmar y verificar los tokens | `campuslands_secret_key_256_bits` |

El proyecto no usa `dotenv`, así que el archivo `.env` no se carga solo. Para usarlo se puede arrancar así:

```bash
node --env-file=.env src/server.js
```

Si no se define ninguna variable, la API funciona con los valores por defecto.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Levanta el servidor con Node |
| `npm run dev` | Levanta el servidor y lo reinicia al guardar cambios (`node --watch`) |
| `npm test` | Ejecuta las pruebas de `src/test` |

## Estructura del proyecto

```
api/
├── src/
│   ├── config/
│   │   └── passport.js           # Estrategias local y JWT de Passport
│   ├── controllers/
│   │   └── auth.controller.js    # Lógica de respuesta de cada endpoint
│   ├── dtos/
│   │   └── cazador.dto.js        # Objetos para limpiar datos de entrada y salida
│   ├── middlewares/
│   │   ├── auth.middleware.js    # Autenticación (401) y autorización admin (403)
│   │   └── error.middleware.js   # Ruta no encontrada (404) y errores (500)
│   ├── models/
│   │   └── cazador.model.js      # Schema de Mongoose y cazadores semilla
│   ├── routes/
│   │   └── auth.routes.js        # Definición de los endpoints
│   ├── services/
│   │   └── cazador.service.js    # Búsquedas, firma del JWT y recompensas
│   ├── test/
│   │   └── api.test.js           # Pruebas de los endpoints
│   ├── validators/
│   │   └── auth.validator.js     # Reglas de express-validator
│   ├── app.js                    # Configuración de Express
│   └── server.js                 # Punto de entrada, levanta el servidor
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Arquitectura y flujo de una petición

El proyecto está separado por capas para que cada archivo tenga una sola responsabilidad:

```
Petición -> Ruta -> Validador -> Middleware de auth -> Controlador -> Servicio -> Datos
```

- **Rutas**: definen la URL y el orden de los middlewares.
- **Validadores**: revisan que el body tenga los campos correctos. Si no, responden 400.
- **Middlewares de auth**: usan Passport para validar las credenciales o el token. Si falla, responden 401. Si el usuario no es admin, responden 403.
- **Controladores**: arman la respuesta HTTP.
- **Servicios**: tienen la lógica de negocio (buscar cazadores, firmar el token, guardar recompensas).
- **DTOs**: controlan qué datos entran y qué datos se devuelven (por ejemplo, nunca se devuelve el password).

### Cómo funciona el login

1. El cliente manda `username` y `password` a `/api/v1/users/authenticate`.
2. `validarLogin` revisa el formato de los campos.
3. `autenticarLocal` usa la estrategia **local** de Passport para buscar el cazador y comparar la contraseña.
4. Si todo está bien, el servicio firma un JWT con HS256 que dura 2 horas.
5. Se devuelve el token junto con el perfil del cazador.

### Cómo funciona una ruta protegida

1. El cliente manda el header `Authorization: Bearer <token>`.
2. `autenticarJWT` usa la estrategia **jwt** de Passport para verificar la firma y la expiración del token.
3. Si el token es válido, el usuario queda guardado en `req.user`.
4. En la bóveda, además, `autorizarAdmin` revisa que el token tenga `admin: true`.

### Contenido del token (payload)

```json
{
  "sub": "1234567890",
  "username": "satinder",
  "name": "Satinder Cyborg",
  "rango": "S",
  "admin": true,
  "iat": 1761140000,
  "exp": 1761147200
}
```

## Endpoints

Todas las rutas de la API llevan el prefijo `/api/v1`.

| Método | Ruta | Seguridad | Estado |
|---|---|---|---|
| POST | `/api/v1/users/authenticate` | Passport LocalStrategy, emite JWT HS256 | 200 / 401 |
| GET | `/api/v1/user/list` | Passport JwtStrategy (Bearer token requerido) | 200 / 401 |
| POST | `/api/v1/boveda/recompensa` | JwtStrategy + autorización (`admin: true`) | 201 / 403 |

También existe `GET /health` para revisar que el servidor esté arriba. Todas las respuestas incluyen el header `X-API-Version`.

### POST /api/v1/users/authenticate

Inicia sesión y devuelve un token.

**Body**

```json
{
  "username": "satinder",
  "password": "12345"
}
```

| Campo | Regla |
|---|---|
| `username` | Entre 3 y 30 caracteres |
| `password` | Entre 4 y 60 caracteres |

**Respuesta 200**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tipo": "Bearer",
  "expiraEn": "2h",
  "cazador": {
    "id": "1234567890",
    "username": "satinder",
    "name": "Satinder Cyborg",
    "rango": "S",
    "admin": true
  }
}
```

**Respuesta 401**

```json
{ "error": "Credenciales inválidas: usuario o contraseña incorrectos" }
```

### GET /api/v1/user/list

Devuelve la lista de cazadores. Necesita token.

**Headers**

```
Authorization: Bearer <token>
```

**Respuesta 200**

```json
{
  "identidadToken": {
    "sub": "9876543210",
    "username": "kael",
    "name": "Kael Vanguard",
    "admin": false
  },
  "data": [
    { "id": "1234567890", "username": "satinder", "name": "Satinder Cyborg", "rango": "S", "admin": true },
    { "id": "9876543210", "username": "kael", "name": "Kael Vanguard", "rango": "A", "admin": false },
    { "id": "5556667770", "username": "nyx", "name": "Nyx Shadowrunner", "rango": "A", "admin": false }
  ]
}
```

**Respuesta 401 (sin token)**

```json
{ "error": "Acceso denegado: debes enviar el header Authorization: Bearer [JWT Token]" }
```

### POST /api/v1/boveda/recompensa

Registra una recompensa. Necesita token de un cazador admin.

**Headers**

```
Authorization: Bearer <token>
```

**Body**

```json
{
  "mision": "Dragón rojo",
  "cristales": 500
}
```

| Campo | Regla |
|---|---|
| `mision` | Entre 3 y 80 caracteres |
| `cristales` | Número entero entre 1 y 100000 |

**Respuesta 201**

```json
{
  "data": {
    "id": "bov-1761140000000",
    "mision": "Dragón rojo",
    "cristales": 500,
    "autorizadoPor": "satinder",
    "createdAt": "2026-10-22T14:00:00.000Z"
  }
}
```

**Respuesta 403 (usuario sin admin)**

```json
{
  "error": "Prohibido (403): tu token es válido, pero necesitas reclamación admin: true para abrir la Bóveda Maestra",
  "rangoActual": "A"
}
```

## Usuarios de prueba

Los cazadores están guardados en memoria en `src/models/cazador.model.js`.

| Username | Password | Nombre | Rango | Admin |
|---|---|---|---|---|
| satinder | 12345 | Satinder Cyborg | S | Sí |
| kael | 54321 | Kael Vanguard | A | No |
| nyx | 99999 | Nyx Shadowrunner | A | No |

## Ejemplos de uso

Con el servidor levantado (`npm run dev`), se puede probar desde Postman, Thunder Client o con `curl`:

1. Iniciar sesión:

```bash
curl -X POST http://localhost:3000/api/v1/users/authenticate \
  -H "Content-Type: application/json" \
  -d '{"username":"satinder","password":"12345"}'
```

2. Copiar el `token` de la respuesta y listar los cazadores:

```bash
curl http://localhost:3000/api/v1/user/list \
  -H "Authorization: Bearer <token>"
```

3. Registrar una recompensa (solo admin):

```bash
curl -X POST http://localhost:3000/api/v1/boveda/recompensa \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mision":"Dragón rojo","cristales":500}'
```

## Códigos de respuesta

| Código | Significado en esta API |
|---|---|
| 200 | Petición correcta |
| 201 | Recompensa creada |
| 400 | El body no pasó las validaciones |
| 401 | Credenciales incorrectas, token faltante, inválido o expirado |
| 403 | El token es válido, pero el usuario no es admin |
| 404 | La ruta no existe |
| 500 | Error interno del servidor |

La diferencia entre 401 y 403: el **401** significa que la API no sabe quién eres (falta autenticación). El **403** significa que sí sabe quién eres, pero no tienes permiso (falta autorización).

## Pruebas

Las pruebas están en `src/test/api.test.js` y usan `node:test` y `supertest`. No hace falta levantar el servidor para correrlas, porque supertest usa directamente la `app` de Express.

```bash
npm test
```

| Endpoint | Caso | Estado esperado |
|---|---|---|
| POST /users/authenticate | Credenciales correctas | 200 y token |
| POST /users/authenticate | Credenciales incorrectas | 401 |
| GET /user/list | Con Bearer token | 200 y 3 cazadores |
| GET /user/list | Sin token | 401 |
| POST /boveda/recompensa | Usuario admin | 201 |
| POST /boveda/recompensa | Usuario sin admin | 403 |

Resultado esperado:

```
tests 6
suites 3
pass 6
fail 0
```

## Flujo de trabajo con Git

- `main`: rama principal.
- `dev`: rama de integración, donde se mezclan los cambios antes de pasar a `main`.
- `feature/<carpeta>`: una rama por cada carpeta de `src` (`feature/config`, `feature/controllers`, `feature/dtos`, etc.).

Cada rama `feature/*` se integró a `dev` con su propio Pull Request.

Los commits siguen el formato de Conventional Commits:

```
feat(routes): agrega rutas de autenticación y bóveda
test: agrega pruebas de los endpoints protegidos
chore: configuración inicial del proyecto
```

## Pendientes y mejoras

Cosas que se pueden agregar en una siguiente versión:

- Conectar a MongoDB con `mongoose.connect()`. El modelo ya existe, pero ahora los datos están en memoria.
- Guardar las contraseñas con hash usando `bcrypt` en lugar de texto plano.
- Guardar las recompensas en la base de datos (ahora se pierden al reiniciar el servidor).
- Agregar `dotenv` para cargar el archivo `.env` automáticamente.
- Agregar un endpoint para listar las recompensas de la bóveda.
- Agregar refresh tokens para no tener que iniciar sesión cada 2 horas.

## Autoría

María José Montepeque (Majo13) - [GitHub](https://github.com/MariaJoseMontepequeZet)
