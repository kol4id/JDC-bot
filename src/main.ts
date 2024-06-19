import dotenv from 'dotenv'
dotenv.config();

import { bot } from './bot/bot';
import { initRedisClient } from './ton-connect/storage';
import {handleBalance, handleConnect, handleDisconect, handleStart, handleText } from './bot/commands-handlers';
import { callbackQuery } from 'telegraf/filters'
import { walletMenuCallbacks } from './bot/connect-wallet-menu';
import { connectDB } from './db/db';
import { handleCoin } from './bot/coinCommands';
import { initState } from './states';
import { handleCollection } from './bot/collectionCommands';
import path from 'path';
import { Worker, isMainThread, parentPort } from 'worker_threads';
import { Screan } from './ton-screan/screan';
import { CoinRepository } from './db/coin.service';
import Coins from './db/schemas/coin.schema';
import { CollectionRepository } from './db/collection.service';
import Collections from './db/schemas/collection.schema';
import { aasda } from './ton-core/tonWallet';
import { WalletRepository } from './db/wallet.service';
import Wallets from './db/schemas/wallet.schema';
import { UserRepository } from './db/user.service';
import Users from './db/schemas/user.schema';

async function main(): Promise<void>{
    await initRedisClient();
    await connectDB();
    initState();
    const screan = new Screan(
        new CoinRepository(Coins), 
        new CollectionRepository(Collections),
        new WalletRepository(Wallets),
        new UserRepository(Users)
    );

    const performTask = async () => {
        // Используем setInterval для периодического выполнения задачи
        setInterval(async () => {
            console.log('Task executed at', new Date().toISOString());
            try {
                await screan.screan(); // Убедитесь, что screan.screan() выполняется асинхронно
            } catch (error) {
                console.error('Error executing task:', error);
            }
        }, 30000);   
    }


    try {
        //TODO(kol4id): create controller -> service system 
        bot.on(callbackQuery('data'), async ctx => {
            const query = ctx.callbackQuery;
            if (!query.data) return;
            
            let request: {method: string, data: string};
            try {
                request = JSON.parse(query.data);
            } catch (err) {
                return;
            }
            if (!walletMenuCallbacks[request.method as keyof typeof walletMenuCallbacks]) return;
        
            walletMenuCallbacks[request.method as keyof typeof walletMenuCallbacks](ctx, request.data);
        })
        bot.command('start', handleStart)
        bot.command('connect', handleConnect);
        bot.command('disconnect', handleDisconect);
        bot.command('balance', handleBalance);    
        bot.command('coin', handleCoin);
        bot.command('collection', handleCollection);
        // bot.command('screan', screan.screan)
        bot.command('screan1', aasda)
        bot.on('text', handleText);

        await performTask()
        // startWorker()
        
    } catch (err) {
        console.log(err)
        main();
    }
    
}

function startWorker() {
    const worker = new Worker(path.resolve('src/screanTask.ts'));

    worker.on('error', (error) => {
        console.error('Worker error:', error);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
            startWorker()
        }
    });
}



main();