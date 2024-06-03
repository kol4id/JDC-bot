import {Address, TonClient} from 'ton'

const client = new TonClient({endpoint: process.env.TON_CENTER_ENDPOINT!})

export async function getWalletBalance(walletAddress: string): Promise<bigint>{
    const address = Address.parse(walletAddress);
    return await client.getBalance(address);
}
