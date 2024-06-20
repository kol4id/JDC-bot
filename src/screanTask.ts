import { CoinRepository } from "./db/coin.service";
import { CollectionRepository } from "./db/collection.service";
import { connectDB } from "./db/db";
import Coins from "./db/schemas/coin.schema";
import Collections from "./db/schemas/collection.schema";
import Users from "./db/schemas/user.schema";
import Wallets from "./db/schemas/wallet.schema";
import { UserRepository } from "./db/user.service";
import { WalletRepository } from "./db/wallet.service";
import { initRedisClient } from "./ton-connect/storage";
import { Screan } from "./ton-screan/screan";
import { parentPort } from 'worker_threads';

const screan = new Screan(
    new CoinRepository(Coins), 
    new CollectionRepository(Collections),
    new WalletRepository(Wallets),
    new UserRepository(Users)
);

const start = async() => {
    await connectDB();
    await initRedisClient();

    if (parentPort) {
        // Выполняем задачу немедленно при запуске
        // performTask();
    
        // Устанавливаем интервал для выполнения задачи каждые 30 секунд
        await performTask()
    }
}

const performTask = async () => {
    // Используем setInterval для периодического выполнения задачи
    setInterval(async () => {
        console.log('Task executed at', new Date().toISOString());
        try {
            await screan.screan(); // Убедитесь, что screan.screan() выполняется асинхронно
        } catch (error) {
            console.error('Error executing task:', error);
        }
    }, 15000);   
}

start()
