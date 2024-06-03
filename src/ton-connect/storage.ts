import { IStorage } from "@tonconnect/sdk";
import { Redis } from 'ioredis'

let client:Redis;

//TODO(kol4id): swap to redis 

export async function initRedisClient(): Promise<void> {
    // await client.connect();
    client = new Redis({port: 6000})
    client.on('error', err => console.log('Redis Client error', err));
}

export class TonConnectStorage implements IStorage{
    constructor(private readonly chatId: number){}

    private getKey(key: string): string {
        return this.chatId.toString() + key;
    }

    async removeItem(key: string): Promise<void>{
        client.del(this.getKey(key));
    }

    async setItem(key: string, value: string): Promise<void>{
        client.set(this.getKey(key), value);
    }    

    async getItem(key: string): Promise<string | null>{
        return client.get(this.getKey(key)) || null;
    }
}