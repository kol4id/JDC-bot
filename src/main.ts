import dotenv from 'dotenv'
dotenv.config();

import { bot } from './bot';
import { getWallets } from './ton-connect/wallet';
import TonConnect from '@tonconnect/sdk';
import { TonConnectStorage } from './ton-connect/storage';
import QRCode from 'qrcode';


//TODO(kol4id): create controller -> service system 
bot.onText(/\/start/, async msg=>{
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, 'Hi 👋, I am the official bot of the Melonia project 🍈. To start, send me the command /connect - to connect your tonkeeper wallet');
})

bot.onText(/\/connect/, async msg=>{
    const chatId = msg.chat.id;
    const wallets = await getWallets();

    const connector = new TonConnect({
        storage: new TonConnectStorage(chatId),
        manifestUrl: process.env.MANIFEST_URL
    })

    connector.onStatusChange(wallet=>{
        if (wallet) {
            bot.sendMessage(chatId, 'wallet connected');
        }
    });

    const tonkeeper = wallets.find(wallet => wallet.appName === 'tonkeeper')!;

    const link = connector.connect({
        bridgeUrl: tonkeeper?.bridgeUrl,
        universalLink: tonkeeper?.universalLink
    });

    const image = await QRCode.toBuffer(link);

    await bot.sendPhoto(chatId, image);
    await bot.sendMessage(chatId, link)

})
