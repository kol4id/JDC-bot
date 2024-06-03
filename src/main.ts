import dotenv from 'dotenv'
dotenv.config();

import { bot } from './bot';
import { getWalletInfo, getWallets } from './ton-connect/wallet';
import QRCode from 'qrcode';
import { getConnector } from './ton-connect/connector';


//TODO(kol4id): create controller -> service system 
bot.onText(/\/start/, async msg=>{
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, 'Hi 👋, I am the official bot of the Melonia project 🍈. To start, send me the command /connect - to connect your tonkeeper wallet');
})

bot.onText(/\/connect/, async msg=>{
    const chatId = msg.chat.id;
    const wallets = await getWallets();

    const connector = getConnector(chatId);

    connector.onStatusChange(async wallet=>{
        if (wallet) {
            const walletName = (await getWalletInfo(wallet.device.appName))?.name || wallet.device.appName;
            bot.sendMessage(chatId, `${walletName} wallet connected`);
        }
    });

    const tonkeeper = wallets.find(wallet => wallet.appName === 'tonkeeper')!;

    const link = connector.connect({
        bridgeUrl: tonkeeper?.bridgeUrl,
        universalLink: tonkeeper?.universalLink
    });

    const image = await QRCode.toBuffer(link);

    await bot.sendPhoto(chatId, image, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Choose a Wallet',
                        callback_data: JSON.stringify({method: 'chose_wallet'})
                    },
                    {
                        text: 'Open Link',
                        url: `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
                            link
                        )}`
                    }
                ]
            ]
        }
    });
    // await bot.sendMessage(chatId, link)

})
