import { getWalletInfo, getWallets } from "./ton-connect/wallet";
import { bot } from "./bot";
import QRCode from 'qrcode';
import { getConnector } from "./ton-connect/connector";
import { Context } from "telegraf";
import { InlineKeyboardButton } from "@telegraf/types";
import TonConnect, { WalletInfoRemote } from "@tonconnect/sdk";


const processingRequests = new Set<number>();

// Define buttons callbacks
export const walletMenuCallbacks = { 
    chose_wallet: onChooseWalletClick,
    select_wallet: onWalletClick,
    universal_qr: onOpenUniversalQRCLink
};

async function onChooseWalletClick(ctx: Context, _:string): Promise<void>{
    const chatId = ctx.callbackQuery?.message?.chat.id!
    try {
        if (processingRequests.has(chatId)) {
            return;
        }
        processingRequests.add(chatId);

        const wallets = await getWallets();
        const walletRows = makeWaletsRowedKeyboard(wallets);
        walletRows.push([{
            text: `<< Back`,
            callback_data: JSON.stringify({
                method: 'universal_qr'
            })
        }]);
        
        await ctx.editMessageReplyMarkup({
            inline_keyboard: walletRows
        })
        
    } catch {
    } finally {
        processingRequests.delete(chatId);
    }
}

async function onOpenUniversalQRCLink(ctx: Context, _: string): Promise<void>{
    const chatId = ctx.callbackQuery?.message?.chat.id!;
    try {
        if (processingRequests.has(chatId)) {
            // await ctx.answerCbQuery("Please wait, processing...");
            return;
        }
        processingRequests.add(chatId);

        const connector = getConnector(chatId);
        const wallets = await getWallets();
    
        const link = connector.connect(wallets);

        await editQR(ctx, link);
        await ctx.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    {
                        text: 'Choose a Wallet',
                        callback_data: JSON.stringify({ method: 'chose_wallet' })
                    },
                    {
                        text: 'Open Link',
                        url: `https://ton-connect.github.io/open-tc?connect=${encodeURIComponent(
                            link
                        )}`
                    }
                ]
            ]
        })
    } catch {
    } finally {
        processingRequests.delete(chatId);
    }
    
}

async function onWalletClick(ctx: Context, data: string): Promise<void> {
    const chatId = ctx.callbackQuery?.message?.chat.id!;
    try {
        if (processingRequests.has(chatId)) {
            // await ctx.answerCbQuery("Please wait, processing...");
            return;
        }
        processingRequests.add(chatId);

        const connector = getConnector(chatId);
        const selectedWallet = await getWalletInfo(data);
        
        if (!selectedWallet) {
            return;
        }
   
        const link = connector.connect({
            bridgeUrl: selectedWallet.bridgeUrl,
            universalLink: selectedWallet.universalLink
        });

        await editQR(ctx, link);
    
        await ctx.editMessageReplyMarkup({
            inline_keyboard: [
                [
                    {
                        text: '« Back',
                        callback_data: JSON.stringify({ method: 'chose_wallet' })
                    },
                    {
                        text: `Open ${selectedWallet.name}`,
                        url: link
                    }
                ]
            ]
        })
    } catch {
    } finally {
        processingRequests.delete(chatId);
    }
    
}

async function editQR(ctx: Context, link: string): Promise<void>{
    try {
        const buffer = await QRCode.toBuffer(link);

        await ctx.editMessageMedia({
            type: 'photo',
            media: {source: buffer}
        })
    } catch {}
}

function makeWaletsRowedKeyboard(wallets: WalletInfoRemote[]): InlineKeyboardButton[][] {
    let walletRows: InlineKeyboardButton[][] = [];
    walletRows = wallets.reduce((acc, wallet, index) => {
        const rowIndex = Math.floor(index / 3); // Создание индекса строки
        if (!acc[rowIndex]) acc[rowIndex] = []; // Создание новой строки, если она не существует
        acc[rowIndex].push({
            text: wallet.name,
            callback_data: JSON.stringify({ method: 'select_wallet', data: wallet.appName })
        });
        return acc;
    }, [] as InlineKeyboardButton[][]);

    return walletRows
}