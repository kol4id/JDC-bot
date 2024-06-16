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

async function main(): Promise<void>{
    await initRedisClient();
    await connectDB();
    initState()

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
        bot.on('text', handleText);
        
    } catch (err) {
        console.log(err)
        main();
    }
    
}

main();