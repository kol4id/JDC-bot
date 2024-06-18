import Users, { IUserDTO } from "./schemas/user.schema";

const projection = {
    _id: 0,
    id: '$_id',
    chatId: 1,
    userName: 1,
    wallets: 1,
    pointsTotal: 1,
    tier: 1
};

export class UserRepository {
    constructor(private usersModel: typeof Users){}

    async create(user: IUserDTO): Promise<IUserDTO>{
        const newUser = (await this.usersModel.create(user));
        return newUser as any as IUserDTO
    }

    async edit(user: IUserDTO): Promise<IUserDTO>{
        const updatedUser = await this.usersModel.findOneAndUpdate({chatId: user.chatId}, user, projection).lean();
        return updatedUser as any as IUserDTO
    }

    async getById(chatId: number): Promise<IUserDTO>{
        const user = await this.usersModel.findOne({chatId: chatId}).lean();
        return user as any as IUserDTO
    }
}