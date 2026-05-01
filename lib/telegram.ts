import TelegramBot from "node-telegram-bot-api";
import type { ReportRecord } from "./db";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
let bot: TelegramBot | null = null;

function getBot() {
  if (!token) {
    return null;
  }
  if (!bot) {
    bot = new TelegramBot(token, { polling: false });
  }
  return bot;
}

export async function notifyTelegram(report: ReportRecord) {
  const telegram = getBot();
  if (!telegram || !chatId) {
    return;
  }

  const locationLine = report.gps_lat && report.gps_lng
    ? `Location: [Map](https://www.google.com/maps/search/?api=1&query=${report.gps_lat},${report.gps_lng})`
    : "Location: not provided";

  const message = [
    `*New injured animal report*`,
    report.description ? `*Description:* ${escapeMarkdown(report.description)}` : "*Description:* not provided",
    report.address ? `*Address:* ${escapeMarkdown(report.address)}` : "*Address:* not provided",
    locationLine,
    report.media_url ? `*Media:* ${report.media_url}` : "*Media:* not included",
    `*Status:* ${report.status}`,
  ].join("\n");

  await telegram.sendMessage(chatId, message, { parse_mode: "Markdown", disable_web_page_preview: true });
}

function escapeMarkdown(text: string) {
  return text.replace(/([*_\[\]()~`>#+=|{}.!-])/g, "\\$1");
}
