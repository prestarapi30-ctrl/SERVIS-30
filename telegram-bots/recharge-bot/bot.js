import dotenv from 'dotenv';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const TOKEN = process.env.RECHARGE_TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = process.env.TELEGRAM_ADMIN_CHAT_ID;
const BACKEND_URL = process.env.BACKEND_URL;
const BOT_API_KEY = process.env.BOT_API_KEY;

if (!TOKEN) throw new Error('Falta RECHARGE_TELEGRAM_BOT_TOKEN');
const bot = new TelegramBot(TOKEN, { polling: true });

// En memoria: información de la sesión por usuario
const sessions = new Map(); // key: chatId, value: { method, amount, token }

function sendPaymentInstructions(chatId, method) {
  const m = (method || '').toUpperCase();
  if (m === 'YAPE') {
    const qr = process.env.PAYMENT_YAPE_QR_URL;
    const phone = process.env.PAYMENT_YAPE_PHONE;
    const text = `Este es el medio de pago YAPE. Envía S/ ${sessions.get(chatId)?.amount} a ${phone} y adjunta captura.`;
    if (qr) bot.sendPhoto(chatId, qr, { caption: text }).catch(() => bot.sendMessage(chatId, text));
    else bot.sendMessage(chatId, text);
  } else if (m === 'EFECTIVO') {
    const text = process.env.PAYMENT_EFECTIVO_INSTRUCTIONS || 'Pago en efectivo coordinado por soporte.';
    bot.sendMessage(chatId, `${text}\nMonto: S/ ${sessions.get(chatId)?.amount}`);
  } else if (m === 'USDT') {
    const wallet = process.env.PAYMENT_USDT_WALLET;
    const network = process.env.PAYMENT_USDT_NETWORK || 'TRC20';
    bot.sendMessage(chatId, `Envia USDT equivalente a S/ ${sessions.get(chatId)?.amount} a la wallet:\n${wallet}\nRed: ${network}`);
  } else {
    bot.sendMessage(chatId, 'Método no reconocido. Elige YAPE, EFECTIVO o USDT.');
  }
}

function notifyAdminNewRecharge({ userChatId, method, amount, token }) {
  if (!ADMIN_CHAT) return;
  const text = [
    'Nueva solicitud de recarga',
    `Usuario chat: ${userChatId}`,
    `Token: ${token}`,
    `Monto: S/ ${amount}`,
    `Método: ${method}`,
    'Para confirmar: /recargar <token> <monto>'
  ].join('\n');
  return bot.sendMessage(ADMIN_CHAT, text);
}

// Profundidad de enlace: /start INTENT_<uuid>
bot.onText(/\/start(?:\s+(.*))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const payload = (match && match[1]) ? match[1].trim() : '';
  const intentMatch = /^INTENT_(\S+)$/i.exec(payload || '');
  if (!intentMatch) {
    bot.sendMessage(chatId, 'Para iniciar una recarga debes ir al Panel y elegir "Recargar saldo". Allí se genera el enlace seguro.');
    return;
  }
  const intentId = intentMatch[1];
  if (!BACKEND_URL || !BOT_API_KEY) {
    bot.sendMessage(chatId, 'Backend no configurado para verificar intents.');
    return;
  }
  try {
    const r = await axios.post(`${BACKEND_URL}/api/bot/intent/verify`, {
      api_key: BOT_API_KEY,
      intent_id: intentId
    });
    const { method, amount, token_saldo } = r.data;
    sessions.set(chatId, { method, amount, token: token_saldo });
    await bot.sendMessage(chatId, `Hola, hemos detectado tu solicitud de recarga por ${method}, monto S/ ${amount}. ¿Es correcto?`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Sí', callback_data: 'CONFIRM_YES' }],
          [{ text: 'No', callback_data: 'CONFIRM_NO' }]
        ]
      }
    });
    await notifyAdminNewRecharge({ userChatId: chatId, method, amount, token: token_saldo });
  } catch (e) {
    bot.sendMessage(chatId, `No se pudo verificar la solicitud. Debes iniciar desde el Panel. (${e.response?.data?.error || e.message})`);
  }
});

bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const s = sessions.get(chatId);
  if (!s) return bot.answerCallbackQuery(q.id);
  if (q.data === 'CONFIRM_YES') {
    bot.answerCallbackQuery(q.id, { text: 'Confirmado' });
    sendPaymentInstructions(chatId, s.method);
  } else if (q.data === 'CONFIRM_NO') {
    bot.answerCallbackQuery(q.id, { text: 'Ok, cancelo.' });
    sessions.delete(chatId);
    bot.sendMessage(chatId, 'Solicitud cancelada. Puedes iniciar de nuevo con /start.');
  }
});

// Captura de comprobante (foto)
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const s = sessions.get(chatId);
  if (!s || !ADMIN_CHAT) return;
  const photo = msg.photo[msg.photo.length - 1];
  const fileId = photo.file_id;
  await bot.sendMessage(ADMIN_CHAT, `Comprobante recibido de usuario ${chatId}. Token ${s.token}, monto S/ ${s.amount}, método ${s.method}.`);
  await bot.sendPhoto(ADMIN_CHAT, fileId);
  await bot.sendMessage(chatId, 'Gracias. Espera confirmación.');
});

// Comando admin: /recargar <token> <monto>
bot.onText(/\/recargar\s+(\S+)\s+(\d+(?:\.\d+)?)/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (String(chatId) !== String(ADMIN_CHAT)) {
    return bot.sendMessage(chatId, 'Este comando es solo para admin.');
  }
  const token = match[1];
  const amount = Number(match[2]);
  if (!BACKEND_URL || !BOT_API_KEY) {
    return bot.sendMessage(chatId, 'BACKEND_URL/BOT_API_KEY no configurados.');
  }
  try {
    const r = await axios.post(`${BACKEND_URL}/api/bot/recarga`, {
      api_key: BOT_API_KEY,
      user_token: token,
      monto: amount
    });
    bot.sendMessage(chatId, `Recarga aplicada. Nuevo saldo: S/ ${r.data.balance}`);
    // Aviso al usuario si está en sesiones
    const userEntry = [...sessions.entries()].find(([, v]) => v.token === token);
    if (userEntry) {
      const userChatId = userEntry[0];
      bot.sendMessage(userChatId, 'Recarga exitosa y confirmada. Saldo añadido.');
    }
  } catch (e) {
    bot.sendMessage(chatId, `Error al recargar: ${e.response?.data?.error || e.message}`);
  }
});

console.log('Recharge bot iniciado.');