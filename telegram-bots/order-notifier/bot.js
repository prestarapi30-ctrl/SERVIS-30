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