import { getConnector } from "../ton-connect/connector";
import { bot } from "./bot";
import { getWalletInfo, getWallets } from "../ton-connect/wallet";
import QRCode from 'qrcode';
import { hexToStringAddr } from "../ton-core/tonWallet";
import TonConnect from "@tonconnect/sdk";
import { Context } from "telegraf";
import { handleCoinInput } from "./coinCommands";
import { majorStage, userStage } from "../states";
import { accessGuard } from "./guard";
import { handleCollectionInput } from "./collectionCommands";
import { UserRepository } from "../db/user.service";
import Users, { IUserDTO } from "../db/schemas/user.schema";
import { UserStorage } from "../ton-connect/storage";

let newConnectRequestListenersMap = new Map<number, () => void>();

const userRepository = new UserRepository(Users);

const userLocal = new UserStorage();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function handleDisconect(ctx: Context): Promise<void>{
    if (!isPrivateChat(ctx)) return;
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

    const user = await getUser(ctx);

    const unsubscribe = connector.onStatusChange(async wallet => {
        if (wallet) {
            await deleteMessage();
            await disconectWallet(ctx, wallet);
            connector.disconnect()
            unsubscribe();
            newConnectRequestListenersMap.delete(chatId);
        }
    });

    const wallets = await getWallets()
    const link = connector.connect(wallets);
    const image = await QRCode.toBuffer(link);

    let userWallets = `Вот твои кошельки:`;
    user.wallets?.forEach(wall =>{
        userWallets += `\n---------------------------------\n${wall}`
    })

    const botMessage = await ctx.replyWithPhoto({source: image}, {
        caption:`${userWallets}\n\nОтсканируй кошельком, чтобы отвязать его\n\nИли выбирай кошелек ниже "Choose a Wallet" и нажми "Open link" это откроет приложение твоего кошелька`,
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

export async function handleStart(ctx: Context): Promise<void>{
    if (!isPrivateChat(ctx)) return;
    const chatId = ctx.chat?.id!;
    const user = await getUser(ctx);
    // if (user){
    //     await sendMessage(ctx, `${ctx.message?.from.username}, 👋 а я тебя уже знаю `);
    // } else {
    await ctx.sendPhoto({source: 'src/assets/tokenomic.jpg'}, {
        parse_mode: 'HTML',
        caption: `Привет, ${ctx.message?.from.username}, анонсируем первый сезон!\nЗарабатывай очки владея <a href="https://getgems.io/collection/EQBQ5N1yWuod9ObxBlOng9GvePdFt856gIYsytx3vxVujpSI#items">NFT</a> из коллекции или монетой <a>$JDC</a>\nТы можешь получить поинты:\n🪙За холд $JDC (1 $JDC = 1 point)\n🖼За холд коммьюнити-NFT (1 NFT = 2 point)\n✔️Выполнение еженедельных заданий - 5.95 point\n\nВ зависимости от накопленных поинтов, владельцы кошельков будут получать от 8% до 30% выплат из доходов проекта (продаж NFT, рекламы и партнерств)\n
<a href="https://www.geckoterminal.com/ton/pools/EQB6lMKC9IY9j2WqNEOzkGi4BsRTQveVUKlIa9L0o_niKj6F">GeckoChart</a> | <a href="https://dexscreener.com/ton/eqb6lmkc9iy9j2wqneozkgi4bsrtqvevuklia9l0o_nikj6f">DexscrChart</a> | <a href="https://dedust.io/swap/TON/EQDxbNb2Kcqv3xBxje2F3XNH8wDjXBfPaNqF-QIYrUdjUJkO">DeDust</a> | <a href="https://getgems.io/collection/EQBQ5N1yWuod9ObxBlOng9GvePdFt856gIYsytx3vxVujpSI">GetGems</a>` 
    })
    await delay(10000)
    await sendMessage(ctx, `Для начала подключай свой кошелек /connect давай узнаем твои очки 😉\n\nHello, ${ctx.message?.from.username}, to get started, connect your wallet /connect let's find out your points 😉`);
    // }
    
}

export async function handleConnect(ctx: Context): Promise<void>{
    if (!isPrivateChat(ctx)) return;
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
        caption: 'Отсканируй любым TON кошельком c монетами или NFT $JDC\n\nИли выбирай кошелек ниже "Choose a Wallet" и нажми "Open link" это откроет приложение твоего кошелька\n\nP.S. ты можешь подключить все свои кошельки 😉, просто используй /connect несколько раз',
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
    if (ctx.text! == '/stop'){
        userStage.delete(chatId);
        return;
    }
    const stage = userStage.get(chatId);
    switch(stage){
        case majorStage.coinEdit: handleCoinInput(ctx);
            break;
        case majorStage.collectionEdit: handleCollectionInput(ctx);
            break;
    }
}

export async function handleStats(ctx: Context): Promise<void>{
    if (!isPrivateChat(ctx)) return;
    console.log('balance called')
    const user = await getUser(ctx);
    
    if (!user.wallets){
        await sendMessage(ctx, `${ctx.message?.from.username}, похоже ты еще не подключил кошелек`);        
    }
    const date = `${String(new Date(user.updatedAt!).getUTCHours()).padStart(2, '0')}:${String(new Date(user.updatedAt!).getUTCMinutes()).padStart(2, '0')}:${String(new Date(user.updatedAt!).getUTCSeconds()).padStart(2, '0')} UTC`
    await sendMessage(ctx, `${ctx.message?.from.username}, твой статус: ${user.tier}\nтвои баллы: ${user.pointsTotal}\nобновлено: ${date}`);    
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
    let user = await userLocal.get(chatId);
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
        userLocal.set(chatId, user);
    }
    return user 
}


async function updateUser(ctx: Context, wallet: any){
    const chatId = ctx.message?.from.id!;
    const user = await getUser(ctx);
    const walletName =
                (await getWalletInfo(wallet.device.appName))?.name || wallet.device.appName;

    const stringAddr = hexToStringAddr(wallet.account.address);
    const isAlreadyConnected = await userRepository.findByWallet(stringAddr);
    
    if (isAlreadyConnected){
        if (isAlreadyConnected.chatId != chatId){
            await sendMessage(ctx, `Кошелек ${walletName} уже подключен к другому аккаунту`);
            return   
        }
        await sendMessage(ctx, `Кошелек ${walletName} уже подключен`);
        return
    }
    
    user.wallets?.push(hexToStringAddr(wallet.account.address));
    user.userName = ctx.message?.from.username;
    userRepository.edit(user);
    userLocal.set(chatId, user);
    await sendMessage(ctx, `Кошелек ${walletName} подключен успешно\n\n!ВАЖНО!\n\nЯ обновляю свои данные каждые 15с, подожди и отправляй команду /my_stats чтоб увидеть свой статус`);
    
}


async function disconectWallet(ctx: Context, wallet: any){
    const chatId = ctx.message?.from.id!;
    const user = await getUser(ctx);
    const walletName =
                (await getWalletInfo(wallet.device.appName))?.name || wallet.device.appName;

    const stringAddr = hexToStringAddr(wallet.account.address);
    const isAlreadyConnected = await userRepository.findByWallet(stringAddr);
    if (!isAlreadyConnected){
        await sendMessage(ctx, `Кошелек ${walletName} не был подключен`);
        return 
    }

    if(isAlreadyConnected.chatId != chatId){
        await sendMessage(ctx, `Кошелек ${walletName} подключен к другому аккаунту, ты, не можешь его отвязать`);
        return
    }

    user.wallets = user.wallets?.filter(wall => wall != stringAddr);
    user.userName = ctx.message?.from.username;
    userRepository.edit(user);
    userLocal.set(chatId, user);
    await sendMessage(ctx, `Кошелек ${walletName} отвязан\n\n!ВАЖНО!\n\nЯ обновляю свои данные каждые 15с, подожди и отправляй команду /my_stats чтоб увидеть свой статус`);
}