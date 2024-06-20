import Coins, { ICoinDTO } from "./schemas/coin.schema";


const projection = {
    _id: 0,
    id: '$_id',
    address: 1,
    pointsPerCoin: 1,
    isActive: 1
};

export class CoinRepository {
    constructor(private coinsModel: typeof Coins){}

    async create(coin: ICoinDTO): Promise<ICoinDTO>{
        const newCoin = (await this.coinsModel.create(coin));
        return newCoin as any as ICoinDTO
    }

    async edit(coin: ICoinDTO): Promise<ICoinDTO>{
        const updatedCoin = await this.coinsModel.findOneAndUpdate({address: coin.address}, coin, projection).lean();
        return updatedCoin as any as ICoinDTO
    }

    async findByAddress(address: string): Promise<ICoinDTO>{
        const coin = await this.coinsModel.findOne({address: address}).lean();
        return coin as any as ICoinDTO
    }

    async findActiveCoins(): Promise<ICoinDTO[]>{
        const coins = await this.coinsModel.find({isActive: true})
        return coins as any as ICoinDTO[]
    }
}