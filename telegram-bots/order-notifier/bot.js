import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const TOKEN = process.env.ORDERS_TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error('Falta ORDERS_TELEGRAM_BOT_TOKEN');
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'SERVISORDENBOT activo. Este bot envía notificaciones de nuevas órdenes al admin.');
});

console.log('Order notifier bot iniciado.');

// Comando admin: /completar <order_id> - actualiza la orden a 'completed' vía backend
// Estado: COMPLETADO
bot.onText(/\/completado\s+(\S+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const orderId = match[1];
  const BACKEND_URL = process.env.BACKEND_URL;
  const BOT_API_KEY = process.env.BOT_API_KEY;
  if (!BACKEND_URL || !BOT_API_KEY) {
    return bot.sendMessage(chatId, 'Configura BACKEND_URL y BOT_API_KEY en el .env.');
  }
  try {
    const resp = await fetch(`${BACKEND_URL}/api/bot/order-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: BOT_API_KEY,
        order_id: orderId,
        status: 'completed'
      })
    });
    if (!resp.ok) {
      let errMsg = `HTTP ${resp.status}`;
      try {
        const err = await resp.json();
        if (err && err.error) errMsg = err.error;
      } catch {}
      throw new Error(errMsg);
    }
    const data = await resp.json();
    bot.sendMessage(chatId, `Orden ${orderId} actualizada a COMPLETADO. Estado actual: ${data.status}`);
  } catch (e) {
    bot.sendMessage(chatId, `Error al completar orden ${orderId}: ${e.message}`);
  }
});

// Alias legacy: /completar <id>
bot.onText(/\/completar\s+(\S+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const orderId = match[1];
  bot.emit('text', { ...msg, text: `/completado ${orderId}` });
});

// Estado: PROCESO
bot.onText(/\/proceso\s+(\S+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const orderId = match[1];
  const BACKEND_URL = process.env.BACKEND_URL;
  const BOT_API_KEY = process.env.BOT_API_KEY;
  if (!BACKEND_URL || !BOT_API_KEY) {
    return bot.sendMessage(chatId, 'Configura BACKEND_URL y BOT_API_KEY en el .env.');
  }
  try {
    const resp = await fetch(`${BACKEND_URL}/api/bot/order-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: BOT_API_KEY, order_id: orderId, status: 'processing' })
    });
    if (!resp.ok) {
      let errMsg = `HTTP ${resp.status}`;
      try { const err = await resp.json(); if (err && err.error) errMsg = err.error; } catch {}
      throw new Error(errMsg);
    }
    const data = await resp.json();
    bot.sendMessage(chatId, `Orden ${orderId} actualizada a PROCESO. Estado actual: ${data.status}`);
  } catch (e) {
    bot.sendMessage(chatId, `Error al actualizar a proceso ${orderId}: ${e.message}`);
  }
});

// Estado: CANCELADO con reembolso automático
bot.onText(/\/cancelado\s+(\S+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const orderId = match[1];
  const BACKEND_URL = process.env.BACKEND_URL;
  const BOT_API_KEY = process.env.BOT_API_KEY;
  if (!BACKEND_URL || !BOT_API_KEY) {
    return bot.sendMessage(chatId, 'Configura BACKEND_URL y BOT_API_KEY en el .env.');
  }
  try {
    const resp = await fetch(`${BACKEND_URL}/api/bot/order-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: BOT_API_KEY, order_id: orderId, status: 'cancelled' })
    });
    if (!resp.ok) {
      let errMsg = `HTTP ${resp.status}`;
      try { const err = await resp.json(); if (err && err.error) errMsg = err.error; } catch {}
      throw new Error(errMsg);
    }
    const data = await resp.json();
    const refundInfo = data.refund_applied ? ` Reembolso aplicado. Nuevo saldo: S/ ${data.new_balance}.` : ' Reembolso no aplicado (ya existía o no correspondía).';
    bot.sendMessage(chatId, `Orden ${orderId} actualizada a CANCELADO.${refundInfo}`);
  } catch (e) {
    bot.sendMessage(chatId, `Error al cancelar orden ${orderId}: ${e.message}`);
  }
});