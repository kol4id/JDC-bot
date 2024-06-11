import TelegramBot from "node-telegram-bot-api";
import { getConnector } from "./ton-connect/connector";
import { bot } from "./bot";
import { getWalletInfo, getWallets } from "./ton-connect/wallet";
import QRCode from 'qrcode';
import { getWalletBalance } from "./ton-core/tonWallet";
import TonConnect from "@tonconnect/sdk";

export async function handleDisconect(msg: TelegramBot.Message): Promise<void>{
    const chatId = msg.chat.id;
    const connector = getConnector(chatId);

    if (!connector.connected){
        await handleWalletConnection(chatId, connector, `You didn't connect a wallet`);
    }

    await connector.disconnect();
    await sendMessage(chatId, 'Wallet has been disconnected');
}

export async function handleStart(msg: TelegramBot.Message): Promise<void>{
    const chatId = msg.chat.id;
    await sendMessage(chatId, 'Hi 👋, I am the official bot of the Melonia project 🍈. To start, send me the command /connect - to connect your tonkeeper wallet');
}

export async function handleConnect(msg: TelegramBot.Message): Promise<void>{
    const chatId = msg.chat.id;
    const connector = getConnector(chatId, () => unsubscribe());
    await connector.restoreConnection();

    if (connector.connected) {
        const connectedName = (await getWalletInfo(connector.wallet!.device.appName))?.name || connector.wallet!.device.appName;
        await sendMessage(chatId, `You have already connected ${connectedName} wallet\n\nDisconnect wallet first to connect new one`)
        return;
    }

    const unsubscribe = connector.onStatusChange(async wallet => {
        if (wallet) {
            const walletName =
                (await getWalletInfo(wallet.device.appName))?.name || wallet.device.appName;
            await sendMessage(chatId, `${walletName} wallet connected successfully`);
            unsubscribe();
        }
    });

    const wallets = await getWallets();
    const tonkeeper = wallets.find(wallet => wallet.appName === 'tonkeeper')!;
    const link = connector.connect({
        bridgeUrl: tonkeeper?.bridgeUrl,
        universalLink: tonkeeper?.universalLink
    });
    
    const image = await QRCode.toBuffer(link);

    await bot.sendPhoto(chatId, image, {
        caption: 'Scan this QR code to connect your Tonkeeper wallet. \nOr just click on the "Open Link" button below',
        reply_markup: {
            inline_keyboard: [
                [
                    // {
                    //     text: 'Choose a Wallet',
                    //     callback_data: JSON.stringify({method: 'chose_wallet'})
                    // },
                    {
                        text: 'Open Link',
                        url: `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
                            link
                        )}`
                    }
                ]
            ],
        }
    });
}

export async function handleBalance(msg: TelegramBot.Message): Promise<void>{
    const chatId = msg.chat.id;
    const connector = getConnector(chatId);
    await connector.restoreConnection();

    if (!connector.connected) {
        await sendMessage(chatId, "You didn't connect a wallet");
        return;
    }

    const walletAddress = connector.account?.address!;
    const balance = await getWalletBalance(walletAddress);
    await sendMessage(chatId, `Your wallet balance is: ${balance} TON`);    
}



async function sendMessage(chatId: number, text: string): Promise<void> {
    await bot.sendMessage(chatId, text);
}

async function handleWalletConnection(chatId: number, connector: TonConnect, errText: string): Promise<void>{
    await connector.restoreConnection();
    if (!connector.connected) {
        await sendMessage(chatId, errText);
        return;
    }
}