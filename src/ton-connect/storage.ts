import { IStorage } from "@tonconnect/sdk";
import { Redis } from 'ioredis'
import { IUserDTO } from "../db/schemas/user.schema";

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

export class UserStorage{
    async get(key: number): Promise<IUserDTO>{
        let result = await client.get(key.toString());
        if (result) result = JSON.parse(result); 
        return result as any as IUserDTO;
    }

    async set(key: number, value: IUserDTO): Promise<void>{
        client.set(key.toString(), JSON.stringify(value));
    }

    async remove(key: number): Promise<void>{
        client.del(key.toString());
    }
}