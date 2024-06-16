import * as process from 'process';
import {Telegraf } from 'telegraf';

const token = process.env.BOT_TOKEN!;
export const bot = new Telegraf(token, {});
bot.launch()

//new TelegramBot(token, {polling: true});