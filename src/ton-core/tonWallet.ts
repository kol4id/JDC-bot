import {Address, TonClient} from 'ton'

const client = new TonClient({endpoint: process.env.TON_CENTER_ENDPOINT!})

const NANOTON_DIV = 1_000_000_000;

export async function getWalletBalance(walletAddress: string): Promise<number>{
    const address = Address.parse(walletAddress);
    const nanoBalance = await client.getBalance(address);
    const balanceInTon = Number(nanoBalance) /  NANOTON_DIV;
    return Number(balanceInTon.toFixed(5));
}
