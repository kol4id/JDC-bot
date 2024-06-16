import Collections, { ICollectionDTO } from "./schemas/collection.schema";

const projection = {
    _id: 0,
    id: '$_id',
    address: 1,
    pointsPerItem: 1,
    isActive: 1
};

export class CollectionRepository {
    constructor(private collectionsModel: typeof Collections){}

    async create(collection: ICollectionDTO): Promise<ICollectionDTO>{
        const newCollection = (await this.collectionsModel.create(collection));
        return newCollection as any as ICollectionDTO
    }

    async edit(collection: ICollectionDTO): Promise<ICollectionDTO>{
        const updatedCollection = await this.collectionsModel.findOneAndUpdate({address: collection.address}, collection, projection).lean();
        return updatedCollection as any as ICollectionDTO
    }

    async getByAddress(address: string): Promise<ICollectionDTO>{
        const collection = await this.collectionsModel.findOne({address: address}).lean();
        return collection as any as ICollectionDTO
    }
}