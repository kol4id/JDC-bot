import {Address, TonClient, crc16} from 'ton'
import TonWeb from 'tonweb'

import  {Api, HttpClient, JettonHolders, NftItems} from 'tonapi-sdk-js'
import Decimal from 'decimal.js';

const endPoint = process.env.TON_CENTER_ENDPOINT!;
const apiKey = process.env.TON_CENTER_KEY!;
const tonweb = new TonWeb(new TonWeb.HttpProvider(endPoint));

const httpClient = new HttpClient({
    baseUrl: 'https://tonapi.io',
    baseApiParams: {
        headers: {
            Authorization: `Bearer ${process.env.TON_KEY!}`,
            'Content-type': 'application/json'
        }
    }
})

const client = new Api(httpClient);

const tonClient = new TonClient({
    endpoint: endPoint,
    apiKey: apiKey
})

const NANO = new Decimal(1_000_000_000);

const CoinAddr = 'EQDxbNb2Kcqv3xBxje2F3XNH8wDjXBfPaNqF-QIYrUdjUJkO'

const tokenAbi = {
    balanceOf: {
        inputs: [
            { name: '_owner', type: 'address' }
        ],
        outputs: [
            { name: 'balance', type: 'uint256' }
        ],
        name: 'balanceOf',
        stateMutability: 'view',
        type: 'function'
    }
};

export async function getWalletBalance(walletAddress: string): Promise<string>{
    let amount: string;
    try{
        const wallet = new TonWeb.utils.Address(walletAddress);
        const balance = await tonweb.getBalance(wallet);
        amount = Number(TonWeb.utils.fromNano(balance)).toFixed(5);
    } catch {}
    return amount!;
}

export async function getTokenHolders(address: string): Promise<JettonHolders>{
    return await client.jettons.getJettonHolders(address);
}

export async function getNftItems(address: string): Promise<NftItems>{
    return await client.nft.getItemsFromCollection(address);
}

export const aasda = async() => {
    const adr = "EQD7h40-JLc4Zsbgy-TzIGN3HABmS892ODVSwtD5pP5-ddRb";
    const nft = await client.nft.getNftItemByAddress(adr);
    console.log(nft);
}

export const fromNano = async(nanoBalance: bigint): Promise<number> => {
    const nanoDecimal = new Decimal(nanoBalance.toString());
    const balance = nanoDecimal.div(NANO).toNumber();
    return Number(balance.toFixed(5))
}

export const stringToHexAddr = (addr: string) =>{
    return Address.parse(addr).toRawString();
}

export const hexToStringAddr = (addr: string) =>{
    return Address.parse(addr).toString();
}