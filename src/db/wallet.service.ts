import { Model } from "mongoose";
import Wallets from "./schemas/wallet.schema";


export class WalletRepository {
    constructor(private walletsModel: typeof Wallets){}

    
}