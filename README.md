# SERVIS-30

Proyecto fullstack con backend Node.js/Express + PostgreSQL, frontend Next.js y bots de Telegram, listo para desplegar en Render y subir a GitHub.

- Backend: API REST con autenticación y gestión de órdenes/transacciones.
- Frontend: Dashboard en Next.js (pages router).
- Bots: `recharge-bot` (recarga de saldo) y opcional `order-notifier` (validación y utilidades). 

Para detalles de despliegue paso a paso, consulta también `DEPLOY/README.md` y los `.env.example` en `DEPLOY/env/`.

## Estructura

```
SERVIS-30/
  .gitignore
  backend/
    server.js
    package.json
    package-lock.json
    .env.example
    sql_init.sql
    src/
      services.js
      auth.js
      db.js
      utils.js
  frontend/
    package.json
    package-lock.json
    next.config.js
    .env.example
    pages/
      _app.js
      index.js
      login.js
      register.js
      dashboard.js
      admin/
        index.js
        login.js
      servicios/
        taxi.js
        vuelos-bus.js
        pago-universidad.js
        cambio-notas.js
        pago-luz.js
        pago-internet.js
        pago-movil.js
    components/
      Layout.js
      Navbar.js
      Sidebar.js
      Card.js
      Modal.js
      ServiceForm.js
    styles/
      global.css
    public/
      logo.svg
  telegram-bots/
    recharge-bot/
      bot.js
      package.json
      package-lock.json
    order-notifier/ (opcional)
      bot.js
      package.json
      package-lock.json
```

Nota: Puede existir un directorio legado `telegram-bot/` con un bot único; la estructura recomendada es `telegram-bots/` con bots separados.

## Variables de entorno

Usa los `.env.example` incluidos y NO subas tus `.env` reales al repositorio.

- Backend (`backend/.env.example`):
  - `DATABASE_URL` — cadena de conexión PostgreSQL (Render External Connection String).
  - `JWT_SECRET` — secreto para firmar tokens.
  - `BOT_API_KEY` — clave compartida para validar llamadas del bot.
  - `ORDERS_TELEGRAM_BOT_TOKEN` (opcional) — token de bot para notificaciones de órdenes.
  - `ORDERS_TELEGRAM_CHAT_ID` (opcional) — chat destino de las notificaciones.
  - `CORS_ORIGIN` — origin permitido del frontend (ej. `https://tu-dominio.com`).

- Frontend (`frontend/.env.example`):
  - `NEXT_PUBLIC_API_URL` — URL pública del backend (ej. `https://backend.onrender.com`).

- Recharge Bot (`DEPLOY/env/recharge-bot.env.example`):
  - `RECHARGE_TELEGRAM_BOT_TOKEN` — token del bot de recarga.
  - `TELEGRAM_ADMIN_CHAT_ID` — chat del admin para revisiones.
  - `BACKEND_URL` — URL del backend (misma que arriba).
  - `BOT_API_KEY` — debe coincidir con el del backend.
  - Opcionales de pago: `PAYMENT_YAPE_QR_URL`, `PAYMENT_YAPE_PHONE`, `PAYMENT_EFECTIVO_INSTRUCTIONS`, `PAYMENT_USDT_WALLET`, `PAYMENT_USDT_NETWORK`.

- Order Notifier (opcional) (`DEPLOY/env/order-notifier.env.example`):
  - `ORDERS_TELEGRAM_BOT_TOKEN` — token del bot de órdenes.

## Base de datos

Usa `backend/sql_init.sql` para crear tablas y triggers:

- `users`, `orders`, `transactions`, `admin_users`, `logs`.

Inicialización:

- Render (recomendado): crea DB PostgreSQL, copia la `External Connection String` y ejecuta `sql_init.sql` desde la consola de SQL o un “One-off Job”.
- Local: `psql "<DATABASE_URL>" -f backend/sql_init.sql`.

## Despliegue en Render

- Backend (Web Service):
  - Root: `SERVIS-30/backend`
  - Build: `npm install`
  - Start: `node server.js`
  - Env: `DATABASE_URL`, `JWT_SECRET`, `BOT_API_KEY`, `CORS_ORIGIN`, opcional `ORDERS_TELEGRAM_*`, y (si lo usas) `BACKEND_URL` para enlaces internos.

- Frontend (Web Service):
  - Root: `SERVIS-30/frontend`
  - Build: `npm install && npm run build`
  - Start: `npm run start`
  - Env: `NEXT_PUBLIC_API_URL` apuntando al backend.

- Recharge Bot (Worker):
  - Root: `SERVIS-30/telegram-bots/recharge-bot`
  - Build: `npm install`
  - Start: `node bot.js`
  - Env: como en la sección de bots.

- Order Notifier (Worker, opcional):
  - Root: `SERVIS-30/telegram-bots/order-notifier`
  - Build: `npm install`
  - Start: `node bot.js`
  - Env: `ORDERS_TELEGRAM_BOT_TOKEN`.

Para una guía detallada y checklist de variables, revisa `DEPLOY/README.md`.

## Conexión Frontend ↔ Backend y CORS

- El frontend consume `NEXT_PUBLIC_API_URL`.
- Configura `CORS_ORIGIN` con el dominio del frontend.

## Flujo de recarga y notificaciones

- En Dashboard, el botón “Recargar saldo” abre el modal.
- “Cancelar” cierra el modal. “Confirmar” valida, crea el intent y abre el bot.
- El backend notifica nuevas órdenes usando `ORDERS_TELEGRAM_BOT_TOKEN` + `ORDERS_TELEGRAM_CHAT_ID` si están configurados.

Nota: el username del bot de recarga está actualmente hardcodeado en `frontend/pages/dashboard.js`. Si cambias de bot, actualiza el username allí o conviértelo a `NEXT_PUBLIC_RECHARGE_BOT_USERNAME`.

## Desarrollo local

- Backend: `cd backend && npm install && node server.js`
- Frontend: `cd frontend && npm install && npm run dev`
- Recharge Bot: `cd telegram-bots/recharge-bot && npm install && node bot.js`
- Order Notifier (opcional): `cd telegram-bots/order-notifier && npm install && node bot.js`

## GitHub y `.gitignore`

- Ya existe `.gitignore` para excluir `node_modules`, `.next`, `out`, `.env`, logs y cachés.
- Sube código fuente, `package.json`, `package-lock.json`, `backend/sql_init.sql` y el folder `DEPLOY/`.
- No subas `node_modules` ni `.env` reales.

## Dominios y SSL

- Añade tu dominio en el servicio del frontend en Render.
- Render provee los registros DNS (CNAME/A) para configurar en tu proveedor (GoDaddy, etc.).
- SSL se emite automáticamente tras validar DNS.