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
    ? `<a href="https://www.google.com/maps/search/?api=1&query=${report.gps_lat},${report.gps_lng}">View on Map</a>`
    : "Location: not provided";

  const message = [
    `<b>🚨 New injured animal report</b>`,
    report.description ? `<b>Description:</b> ${escapeHtml(report.description)}` : "<b>Description:</b> not provided",
    report.address ? `<b>Address:</b> ${escapeHtml(report.address)}` : "<b>Address:</b> not provided",
    `<b>Coordinates:</b> ${report.gps_lat && report.gps_lng ? `${report.gps_lat.toFixed(5)}, ${report.gps_lng.toFixed(5)}` : "not provided"}`,
    locationLine,
    report.media_url ? `<b>Media:</b> <a href="${report.media_url}">View attachment</a>` : "<b>Media:</b> not included",
    `<b>Status:</b> ${report.status}`,
  ].join("\n");

  try {
    await telegram.sendMessage(chatId, message, { parse_mode: "HTML", disable_web_page_preview: false });
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
