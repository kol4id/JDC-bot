import { getConnector } from "../ton-connect/connector";
import { bot } from "./bot";
import { getWalletInfo, getWallets } from "../ton-connect/wallet";
import QRCode from 'qrcode';
import { getTokenHolders, getWalletBalance } from "../ton-core/tonWallet";
import TonConnect from "@tonconnect/sdk";
import { Context } from "telegraf";
import { handleCoinInput } from "./coinCommands";
import {majorStage, userStage} from "../states";
import { accessGuard } from "./guard";
import { handleCollectionInput } from "./collectionCommands";
import { UserRepository } from "../db/user.service";
import Users from "../db/schemas/user.schema";

let newConnectRequestListenersMap = new Map<number, () => void>();

const userRepository = new UserRepository(Users);

export async function handleDisconect(ctx: Context): Promise<void>{
    const chatId = ctx.chat?.id!;
    const connector = getConnector(chatId);

    if (!connector.connected){
        await handleWalletConnection(ctx, connector, `You didn't connect a wallet`);
        return;
    }

    await connector.disconnect();
    await sendMessage(ctx, 'Wallet has been disconnected');
}

export async function handleStart(ctx: Context): Promise<void>{
    const chatId = ctx.chat?.id!;
    await sendMessage(ctx, 'Hi 👋, I am the official bot of the Melonia project 🍈. To start, send me the command /connect - to connect your tonkeeper wallet');
}

export async function handleConnect(ctx: Context): Promise<void>{
    const chatId = ctx.chat?.id!;
    let messageWasDeleted = false;

    newConnectRequestListenersMap.get(chatId)?.();

    const connector = getConnector(chatId, () => {
        unsubscribe();
        newConnectRequestListenersMap.delete(chatId);
        deleteMessage();
    });

    if (connector.connected) {
        const connectedName = (await getWalletInfo(connector.wallet!.device.appName))?.name || connector.wallet!.device.appName;
        await sendMessage(ctx, `You have already connected ${connectedName} wallet\n\nDisconnect wallet first to connect new one`)
        return;
    }

    const unsubscribe = connector.onStatusChange(async wallet => {
        if (wallet) {
            await deleteMessage();
            const walletName =
                (await getWalletInfo(wallet.device.appName))?.name || wallet.device.appName;
            await sendMessage(ctx, `${walletName} wallet connected successfully`);
            unsubscribe();
            newConnectRequestListenersMap.delete(chatId);
        }
    });

    const wallets = await getWallets()
    const link = connector.connect(wallets);
    const image = await QRCode.toBuffer(link);

    const botMessage = await ctx.replyWithPhoto({source: image}, {
        caption: 'Scan this QR code to connect your Tonkeeper wallet. \nOr just click on the "Open Link" button below',
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
            ],
        }
    });

    const deleteMessage = async (): Promise<void> => {
        if (!messageWasDeleted) {
            messageWasDeleted = true;
            bot.telegram.deleteMessage(chatId, botMessage.message_id);
        }
    };

    newConnectRequestListenersMap.set(chatId, async () => {
        unsubscribe();
        await deleteMessage();
        newConnectRequestListenersMap.delete(chatId);
    });
}

export async function handleText(ctx: Context): Promise<void>{
    const chatId = ctx.chat?.id!;
    if (!isPrivateChat(ctx)) return
    if (!accessGuard(ctx)) return
    const stage = userStage.get(chatId);
    switch(stage){
        case majorStage.coinEdit: handleCoinInput(ctx);
            break;
        case majorStage.collectionEdit: handleCollectionInput(ctx);
            break;
    }
}

export async function handleBalance(ctx: Context): Promise<void>{
    console.log('balance called')
    const chatId = ctx.chat?.id!;
    // const connector = getConnector(chatId);
    // await connector.restoreConnection();

    // if (!connector.connected) {
    //     await sendMessage(ctx, "You didn't connect a wallet");
    //     return;
    // }

    // const walletAddress = connector.account?.address!;
    // const balance = await getWalletBalance(walletAddress);
    // await getTokenHolders();
    await sendMessage(ctx, `Your wallet balance is: TON`);    
    // await sendMessage(ctx, `Your wallet balance is: ${balance} TON`);    
}

async function sendMessage(ctx: Context, text: string): Promise<void> {
    ctx.sendMessage(text);
}

async function handleWalletConnection(ctx: Context, connector: TonConnect, errText: string): Promise<void>{
    await connector.restoreConnection();
    if (!connector.connected) {
        await sendMessage(ctx, errText);
        return;
    }
}

// , address: string, pointsPerCoin: number, isActive: boolean
export const isPrivateChat = (ctx: Context) => {
    return ctx.chat?.type === 'private';
};
