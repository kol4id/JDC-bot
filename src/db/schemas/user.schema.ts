import mongoose, {Schema, Document} from "mongoose"

export interface IUserDTO {
    chatId: number;
    userName?: string;
    wallets?: string[];
    pointsTotal: number;
    tier: string;
    updatedAt?: Date;
}

interface IUser extends IUserDTO, Document {}

const UserSchema: Schema = new Schema({
    chatId: {type: Number, required: true},
    userName: {type: String},
    wallets: {type: [String]},
    pointsTotal: {type: Number, required: true},
    tier: {type: String, required: true},
}, {
    timestamps: true
})

const Users = mongoose.model<IUser>('Users', UserSchema);
export default Users;