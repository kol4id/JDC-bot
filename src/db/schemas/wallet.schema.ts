import mongoose, {Schema, Document} from "mongoose"

export interface INFTCollection {
    collectionAddress: string;
    NFTAddress: string[];
    points: number;
}

export interface ICoinsHold {
    coinAddress: string;
    balance: number;
    points: number;
}

export interface IWalletDTO {
    address: string;
    NFTCollections?: INFTCollection;
    NFTPointsTotal: number;
    coinsHold?: ICoinsHold;
    coinsPointsTotal: number;
    walletPointsTotal: number;
    isActive: boolean;
}

interface IWallet extends IWalletDTO, Document {}

const WalletSchema: Schema = new Schema({
    address: {type: String, required: true},
    NFTCollections: {type: [{
        collectionAddress: {type: String, required: true},
        NFTAddress: {type: [String], required: true},
        points: {type: Number, required: true},
    }]},
    NFTPointsTotal: {type: Number, required: true},
    coinsHold: {type: [{
        coinAddress: {type: String, required: true},
        balance: {type: Number, required: true},
        points: {type: Number, required: true},
    }]},
    coinsPointsTotal: {type: Number, required: true},
    walletPointsTotal: {type: Number, required: true},
    isActive: {type: Boolean, required: true},
}, {
    timestamps: true
})

const Wallets = mongoose.model<IWallet>('Wallets', WalletSchema);
export default Wallets;