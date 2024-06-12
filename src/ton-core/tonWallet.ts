import {Address, TonClient} from 'ton'
import TonWeb from 'tonweb'

const endPoint = process.env.TON_CENTER_ENDPOINT!;
const tonweb = new TonWeb(new TonWeb.HttpProvider(endPoint));

const NANOTON_DIV = 1_000_000_000;

export async function getWalletBalance(walletAddress: string): Promise<string>{
    let amount;
    try{
        const wallet = new TonWeb.utils.Address(walletAddress);
        const balance = await tonweb.getBalance(wallet);
        amount = TonWeb.utils.fromNano(balance);
        console.log(amount);

    } catch {}
    // const address = Address.parse(walletAddress);
    // const nanoBalance = await client.getBalance(address);
    // const balanceInTon = Number(nanoBalance) /  NANOTON_DIV;
    // return Number(balanceInTon.toFixed(5));
    return amount!;
}
