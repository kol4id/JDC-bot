import { getConnector } from "../ton-connect/connector";
import { bot } from "./bot";
import { getWalletInfo, getWallets } from "../ton-connect/wallet";
import QRCode from 'qrcode';
import { getTokenHolders, getWalletBalance, hexToStringAddr } from "../ton-core/tonWallet";
import TonConnect from "@tonconnect/sdk";
import { Context } from "telegraf";
import { handleCoinInput } from "./coinCommands";
import {majorStage, userStage} from "../states";
import { accessGuard } from "./guard";
import { handleCollectionInput } from "./collectionCommands";
import { UserRepository } from "../db/user.service";
import Users, { IUserDTO } from "../db/schemas/user.schema";

let newConnectRequestListenersMap = new Map<number, () => void>();

const userRepository = new UserRepository(Users);
export const users = new Map<number, IUserDTO>();

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
    const user = await getUser(ctx);
    user
        ?   await sendMessage(ctx, `Привет, ${ctx.message?.from.username}, 👋 а я тебя знаю `)
        :   await sendMessage(ctx, `Привет, ${ctx.message?.from.username}, для начала подключай свой кошелек /connect давай узнаем твои очки 😉\n\nHello, ${ctx.message?.from.username}, to get started, connect your wallet /connect let's find out your points 😉`)
    
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
        connector.disconnect()
    }

    const unsubscribe = connector.onStatusChange(async wallet => {
        if (wallet) {
            await deleteMessage();
            await updateUser(ctx, wallet);
            connector.disconnect()
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
    const connector = getConnector(chatId);
    await connector.restoreConnection();

    if (!connector.connected) {
        await sendMessage(ctx, "You didn't connect a wallet");
        return;
    }

    const walletAddress = connector.account?.address!;
    const balance = await getWalletBalance(walletAddress);
    // await getTokenHolders();
    await sendMessage(ctx, `Your wallet balance is: ${balance} TON`);    
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

async function getUser(ctx: Context): Promise<IUserDTO>{
    const chatId = ctx.message?.from.id!;
    let user = users.get(chatId);
    if (!user){
        user = await userRepository.findById(chatId);
        if (!user) {
            user = await userRepository.create({
                chatId: chatId,
                userName: ctx.message?.from.username,
                pointsTotal: 0,
                tier: 'bronze'
            })
        }
        users.set(chatId, user);
    }
    return user 
}


async function updateUser(ctx: Context, wallet: any){
    const chatId = ctx.message?.from.id!;
    const user = await getUser(ctx);
    const walletName =
                (await getWalletInfo(wallet.device.appName))?.name || wallet.device.appName;

    if (user.wallets?.find(wall => wall == hexToStringAddr(wallet.account.address))){
        await sendMessage(ctx, `${walletName} уже подключен`);
        return;
    }       
    
    user.wallets?.push(hexToStringAddr(wallet.account.address));
    user.userName = ctx.message?.from.username;
    userRepository.edit(user);
    users.set(chatId, user);
    await sendMessage(ctx, `${walletName} wallet connected successfully`);
}