import dotenv from 'dotenv'
dotenv.config();

import { bot } from './bot';
import { getWalletInfo, getWallets } from './ton-connect/wallet';
import QRCode from 'qrcode';
import { getConnector } from './ton-connect/connector';
import { getWalletBalance } from './ton-core/tonWallet';
import { initRedisClient } from './ton-connect/storage';
import { handleBalance, handleConnect, handleDisconect, handleStart } from './commands-handlers';

async function main(): Promise<void>{
    await initRedisClient();

    //TODO(kol4id): create controller -> service system 
    bot.onText(/\/start/, handleStart);
    bot.onText(/\/connect/, handleConnect);
    bot.onText(/\/disconnect/, handleDisconect);
    bot.onText(/\/balance/, handleBalance);
}

main();