import Wallets, { IWalletDTO } from "./schemas/wallet.schema";

const projection = {
    _id: 0,
    id: '$_id',
    address: 1,
    NFTCollections: 1,
    NFTPointsTotal: 1,
    coinsHold: 1,
    coinsPointsTotal: 1,
    walletPointsTotal: 1,
    isActive: 1
};

export class WalletRepository {
    constructor(private walletsModel: typeof Wallets){}

    async create(wallet: IWalletDTO): Promise<void>{
        const newWallet = await this.walletsModel.create(wallet);
    }

    async findByAddress(address: string): Promise<IWalletDTO>{
        const wall = await this.walletsModel.findOne({address: address}, projection).lean()
        return wall as any as IWalletDTO
    }

    async edit(wallet: IWalletDTO): Promise<IWalletDTO>{
        const updatedWallet = await this.walletsModel.findOneAndUpdate({address: wallet.address}, wallet, {projection: projection}).lean();
        return updatedWallet as any as IWalletDTO
    }

    async updateMany(wallets: IWalletDTO[]): Promise<void>{
        // this.walletsModel.updateMany()
        const newWalletsAddr = wallets.map(wallet => wallet.address);

        const bulkOps = wallets.map(wallet => {
            return {
                updateOne: {
                    filter: { address: wallet.address },
                    update: {
                        $set: {
                        address: wallet.address,
                        NFTCollections: wallet.NFTCollections,
                        NFTPointsTotal: wallet.NFTPointsTotal,
                        coinsHold: wallet.coinsHold,
                        coinsPointsTotal: wallet.coinsPointsTotal ?? 0,
                        walletPointsTotal: wallet.walletPointsTotal ?? 0,
                        isActive: wallet.isActive
                        }
                    },
                    upsert: true
                }
            };
        });
        
        try {
            await this.walletsModel.bulkWrite(bulkOps);
            await this.walletsModel.deleteMany({address: {$nin: newWalletsAddr}})
        } catch (error) {
            console.error('Error during bulk write operation:', error);
        }
    }
}