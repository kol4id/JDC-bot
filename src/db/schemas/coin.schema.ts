import mongoose, {Schema, Document} from "mongoose"

export interface ICoinDTO {
    address: string;
    pointsPerCoin: number;
    isActive: boolean;
}

interface ICoin extends ICoinDTO, Document{}

const CoinSchema: Schema = new Schema({
    address: {type: String, required: true},
    pointsPerCoin: {type: Number, required: true},
    isActive: {type: Boolean, required: true},
}, {
    timestamps: true
})

const Coins = mongoose.model<ICoin>('Coins', CoinSchema);
export default Coins


