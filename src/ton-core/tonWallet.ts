import {Address, TonClient, crc16} from 'ton'
import TonWeb from 'tonweb'

import  {Api, HttpClient, JettonHolders} from 'tonapi-sdk-js'
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

    // await getTokenHolders()
    // const address = Address.parse(walletAddress);
    // const nanoBalance = await client.getBalance(address);
    // const balanceInTon = Number(nanoBalance) /  NANOTON_DIV;
    // return Number(balanceInTon.toFixed(5));
    return amount!;
}

export async function getTokenHolders(address: string): Promise<JettonHolders>{
    return await client.jettons.getJettonHolders(address);
    // const userAddr = 'UQBvlxYuIhJmzR6pHauU3NMZpq5Xf52TZ6kuUUvPaaU3flcT'
    // const addr = 'EQDxbNb2Kcqv3xBxje2F3XNH8wDjXBfPaNqF-QIYrUdjUJkO';
    // const wallet = new TonWeb.utils.Address(addr);
    // console.log(wallet)
    // // tonClient.
    // // const contr = tonClient.open()

    // const 
    // console.log(holders)
    // const acc = await client.accounts.getAccountJettonsBalances(userAddr);
    // const mel = acc.balances.findIndex(bal => bal.jetton.name === 'Melon');
    // console.log(acc.balances[mel])
    // const melAdr = new TonWeb.utils.Address(mel?.wallet_address.address!);
    // console.log(melAdr)
    // acc.balances.forEach(bal => {
    //     console.log(bal)
    // })
    // console.log(acc);
}


const aasda = async() => {
    const bounc = "UQCq45xZ6OEYlR-J5BSn8R4ddwhFQ5XsptTYB5gRvQ9dVLZA";
    const hex = '0:aae39c59e8e118951f89e414a7f11e1d7708454395eca6d4d8079811bd0f5d54'

    
    const nftUser = await client.accounts.getAccountNftItems('UQBHcofnbMpuNKF3TbXntawVzf5C4_dScc_W-fU5ZxVY6lR4');
    nftUser.nft_items.forEach(nft => {
        if (nft.collection?.address)
        console.log(Address.parse(nft.collection?.address));
    })
    // console.log(nftUser)
    // const nftGrouped: Record<string, string[]> = {};
    // const nft = await client.nft.getItemsFromCollection("EQBQ5N1yWuod9ObxBlOng9GvePdFt856gIYsytx3vxVujpSI");

    // console.log(nft)
    // nft.nft_items.forEach(_nft => {
    //     const key = _nft.owner?.address!
    //     if (!nftGrouped[key]) nftGrouped[key] = [];
    //     nftGrouped[key].push(_nft.address);
    // })
    // console.log(Object.entries(nftGrouped).length)

    // console.log(nftGrouped)
    // console.log(nftGrouped['0:6895c9904d03b3f09d7a52cc5d172f56c8c3a8cf4227f0c1590dd99471a30b47'])
    

    // Object.entries(nftGrouped).forEach(([key, value]) => {
    //     console.log(key)
    //     console.log(value.length)
    //     console.log('=======================')
    // })

    // const wallet = Address.parse(bounc)
    
    // console.log(wallet.hash)
    // wallet.toString('hex')   
}

export const fromNano = async(nanoBalance: bigint): Promise<number> => {
    const nanoDecimal = new Decimal(nanoBalance.toString());
    const balance = nanoDecimal.div(NANO).toNumber();
    return Number(balance.toFixed(5))
}
