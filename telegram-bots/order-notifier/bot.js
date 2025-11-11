import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

dotenv.config();

const TOKEN = process.env.ORDERS_TELEGRAM_BOT_TOKEN;
if (!TOKEN) throw new Error('Falta ORDERS_TELEGRAM_BOT_TOKEN');
const bot = new TelegramBot(TOKEN, { polling: true });

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'SERVISORDENBOT activo. Este bot envía notificaciones de nuevas órdenes al admin.');
});

console.log('Order notifier bot iniciado.');

// Comando admin: /completar <order_id> - actualiza la orden a 'completed' vía backend
bot.onText(/\/completar\s+(\S+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const orderId = match[1];
  const BACKEND_URL = process.env.BACKEND_URL;
  const BOT_API_KEY = process.env.BOT_API_KEY;
  if (!BACKEND_URL || !BOT_API_KEY) {
    return bot.sendMessage(chatId, 'Configura BACKEND_URL y BOT_API_KEY en el .env.');
  }
  try {
    const r = await axios.post(`${BACKEND_URL}/api/bot/order-update`, {
      api_key: BOT_API_KEY,
      order_id: orderId,
      status: 'completed'
    });
    bot.sendMessage(chatId, `Orden ${orderId} actualizada a COMPLETED. Estado actual: ${r.data.status}`);
  } catch (e) {
    bot.sendMessage(chatId, `Error al completar orden ${orderId}: ${e.response?.data?.error || e.message}`);
  }
});