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
        const updatedUser = await this.usersModel.updateOne({chatId: user.chatId}, user).lean();
        return updatedUser as any as IUserDTO
    }

    async addWallet(chatId: number, wallet: string){
        await this.usersModel.findOneAndUpdate({chatId}, {$push: {wallets: wallet}})
    }

    async findById(chatId: number): Promise<IUserDTO>{
        const user = await this.usersModel.findOne({chatId: chatId}).lean();
        return user as any as IUserDTO
    }

    async findAllUsers(): Promise<IUserDTO[]>{
        const users = await this.usersModel.find().lean()
        return users as any as IUserDTO[];
    }

    async updateMany(users: IUserDTO[]){
        const bulkOps = users.map(user => {
            return {
                updateOne: {
                    filter: { chatId: user.chatId },
                    update: {
                        $set: {
                            pointsTotal: user.pointsTotal,
                            tier: user.tier
                        }
                    },
                    upsert: true
                }
            };
        });
        
        try {
            await this.usersModel.bulkWrite(bulkOps);
            console.log('Bulk write operation successful');
        } catch (error) {
            console.error('Error during bulk write operation:', error);
        }
    }
}