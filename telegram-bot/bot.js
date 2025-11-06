import dotenv from 'dotenv';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const BOT_API_KEY = process.env.BOT_API_KEY;
const ADMIN_CHAT_ID = Number(process.env.TELEGRAM_ADMIN_CHAT_ID || '0');

if (!TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN no configurado');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

// Estado en memoria por chat y por solicitud
const pendingByChat = new Map(); // chatId -> { token, amount, method, status, reqId }
const pendingById = new Map();   // reqId -> { chatId, token, amount, method, status }

function genReqId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function methodKeyboard(reqId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'YAPE', callback_data: `method:YAPE:${reqId}` },
          { text: 'USDT', callback_data: `method:USDT:${reqId}` },
          { text: 'PAGO EFECTIVO', callback_data: `method:EFECTIVO:${reqId}` }
        ]
      ]
    }
  };
}

function confirmKeyboard(reqId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [ { text: 'Sí', callback_data: `confirm:YES:${reqId}` }, { text: 'No', callback_data: `confirm:NO:${reqId}` } ]
      ]
    }
  };
}

bot.onText(/^\/start$/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Bienvenido a SERVIS-30 Bot\nComandos:\n/recargar {user_token} {monto}\n/saldo {user_token}');
});

bot.onText(/^\/recargar\s+(\S+)\s+(\d+(?:\.\d{1,2})?)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const token = match[1];
  const amount = match[2];
  const reqId = genReqId();
  const pending = { token, amount, method: null, status: 'choose_method', reqId };
  pendingByChat.set(chatId, pending);
  pendingById.set(reqId, { chatId, token, amount, method: null, status: 'choose_method' });
  bot.sendMessage(chatId, `Selecciona método de recarga para S/ ${amount}:`, methodKeyboard(reqId));
});

bot.onText(/^\/saldo\s+(\S+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const token = match[1];
  try {
    const r = await axios.get(`${BACKEND_URL}/api/bot/saldo`, {
      params: { api_key: BOT_API_KEY, user_token: token }
    });
    bot.sendMessage(chatId, `Saldo actual: S/ ${r.data.balance}`);
  } catch (e) {
    bot.sendMessage(chatId, `Error: ${e.response?.data?.error || e.message}`);
  }
});

// Actualizar estado de orden: /orden {order_id} {status}
// Estados permitidos: pending | processing | completed | cancelled
bot.onText(/^\/orden\s+([a-f0-9\-]+)\s+(pending|processing|completed|cancelled)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const orderId = match[1];
  const status = match[2].toLowerCase();
  try {
    const r = await axios.post(`${BACKEND_URL}/api/bot/order-update`, {
      api_key: BOT_API_KEY,
      order_id: orderId,
      status
    });
    bot.sendMessage(chatId, `Orden ${orderId} actualizada a '${status}'.`);
  } catch (e) {
    bot.sendMessage(chatId, `Error: ${e.response?.data?.error || e.message}`);
  }
});

// Atajo: /orden_completada {order_id}
bot.onText(/^\/orden_completada\s+([a-f0-9\-]+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const orderId = match[1];
  try {
    const r = await axios.post(`${BACKEND_URL}/api/bot/order-update`, {
      api_key: BOT_API_KEY,
      order_id: orderId,
      status: 'completed'
    });
    bot.sendMessage(chatId, `Orden ${orderId} actualizada a 'completed'.`);
  } catch (e) {
    bot.sendMessage(chatId, `Error: ${e.response?.data?.error || e.message}`);
  }
});

console.log('SERVIS-30 Telegram bot iniciado');
// Interacciones de botones (método y confirmación)
bot.on('callback_query', async (cq) => {
  try {
    const chatId = cq.message?.chat?.id;
    const data = cq.data || '';
    if (!chatId || !data) return;
    const p = pendingByChat.get(chatId);
    if (!p) return bot.answerCallbackQuery(cq.id, { text: 'Sin solicitud activa.' });
    const [kind, value, reqId] = data.split(':');
    if (reqId !== p.reqId) return bot.answerCallbackQuery(cq.id, { text: 'Solicitud distinta.' });

    if (kind === 'method') {
      p.method = value; p.status = 'confirm_method';
      const methodText = value === 'EFECTIVO' ? 'PAGO EFECTIVO' : value;
      bot.answerCallbackQuery(cq.id);
      await bot.sendMessage(chatId, `Has elegido ${methodText} para S/ ${p.amount}. ¿Confirmas?`, confirmKeyboard(reqId));
      return;
    }

    if (kind === 'confirm') {
      bot.answerCallbackQuery(cq.id);
      if (value === 'NO') {
        pendingByChat.delete(chatId);
        pendingById.delete(reqId);
        return bot.sendMessage(chatId, 'Solicitud cancelada. Usa /recargar nuevamente.');
      }
      // Confirmado: preparar flujo según método
      p.status = 'await_admin_instructions';
      pendingById.set(reqId, { chatId, token: p.token, amount: p.amount, method: p.method, status: p.status });

      const methodText = p.method === 'EFECTIVO' ? 'PAGO EFECTIVO' : p.method;

      // Deep-link sugerido al bot @PAGASEGUROBOT (el otro bot recibe el payload al abrirlo)
      const payload = `REQ_${reqId}_AMT_${p.amount}_${p.method}`;
      const deepLink = `https://t.me/PAGASEGUROBOT?start=${encodeURIComponent(payload)}`;

      await bot.sendMessage(chatId,
        `Hemos identificado tu solicitud de recarga por ${methodText} de S/ ${p.amount}.
Correcto. Abre este enlace para coordinar el pago con seguridad:
${deepLink}

En breve te enviaremos las instrucciones (número/QR) aquí mismo.`
      );

      // Aviso al admin con datos de la solicitud
      if (ADMIN_CHAT_ID) {
        await bot.sendMessage(ADMIN_CHAT_ID,
          `Nueva solicitud REQ:${reqId}\nUsuario chatId: ${chatId}\nToken: ${p.token}\nMonto: S/ ${p.amount}\nMétodo: ${methodText}\n` +
          `Por favor responde con instrucciones/QR usando el prefijo REQ:${reqId} en el mensaje o en el caption de la imagen.`
        );
      }
      return;
    }
  } catch (e) {
    // Evitar bloqueo por errores en callbacks
  }
});

// Mensajes entrantes: admin envía instrucciones o confirma pago
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || msg.caption || '';

  // Admin envía instrucciones para una solicitud: reenviar al usuario
  if (ADMIN_CHAT_ID && chatId === ADMIN_CHAT_ID) {
    const m = /REQ:([A-Z0-9]+)/.exec(text || '');
    if (m) {
      const reqId = m[1];
      const pend = pendingById.get(reqId);
      if (pend) {
        try {
          // Reenviar mensaje/imagen al usuario
          await bot.forwardMessage(pend.chatId, ADMIN_CHAT_ID, msg.message_id);
          await bot.sendMessage(pend.chatId, `Yapear aquí el monto solicitado y enviar comprobante de pago.`);
          // Actualizar estado para esperar comprobante del usuario
          const p = pendingByChat.get(pend.chatId);
          if (p) { p.status = 'await_user_proof'; pendingById.set(reqId, { ...pend, status: 'await_user_proof' }); }
        } catch (e) {
          await bot.sendMessage(ADMIN_CHAT_ID, `Error reenviando al usuario: ${e.message}`);
        }
      }
    }

    // Admin confirma pago: "OK REQ:<id> [monto]"
    const ok = /^OK\s+REQ:([A-Z0-9]+)(?:\s+(\d+(?:\.\d{1,2})?))?/i.exec(text || '');
    if (ok) {
      const reqId = ok[1];
      const montoOverride = ok[2];
      const pend = pendingById.get(reqId);
      if (pend) {
        const monto = montoOverride || pend.amount;
        try {
          const r = await axios.post(`${BACKEND_URL}/api/bot/recarga`, {
            api_key: BOT_API_KEY,
            user_token: pend.token,
            monto
          });
          await bot.sendMessage(pend.chatId, `RECARGA EXITOSA. Esperando saldo añadido...`);
          await bot.sendMessage(pend.chatId, `Saldo añadido en el panel. Nuevo saldo: S/ ${r.data.balance}`);
          // limpiar estado
          pendingByChat.delete(pend.chatId);
          pendingById.delete(reqId);
        } catch (e) {
          await bot.sendMessage(pend.chatId, `Error al acreditar saldo: ${e.response?.data?.error || e.message}`);
          await bot.sendMessage(ADMIN_CHAT_ID, `Error al acreditar saldo: ${e.response?.data?.error || e.message}`);
        }
      }
    }
    return; // mensajes del admin manejados arriba
  }

  // Usuario envía comprobante (foto/documento) cuando estamos esperando prueba
  const p = pendingByChat.get(chatId);
  if (p && p.status === 'await_user_proof') {
    try {
      // Reenviar comprobante al admin
      if (ADMIN_CHAT_ID) {
        await bot.forwardMessage(ADMIN_CHAT_ID, chatId, msg.message_id);
        await bot.sendMessage(ADMIN_CHAT_ID, `Comprobante recibido del usuario chatId ${chatId} para REQ:${p.reqId}`);
      }
      await bot.sendMessage(chatId, `Comprobante enviado. Esperando confirmación del pago...`);
      // Actualizar estado
      p.status = 'await_admin_confirmation';
      pendingById.set(p.reqId, { chatId, token: p.token, amount: p.amount, method: p.method, status: p.status });
    } catch (e) {
      await bot.sendMessage(chatId, `Error enviando comprobante: ${e.message}`);
    }
  }
});