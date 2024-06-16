import mongoose, {Schema, Document} from "mongoose"

export interface ICollectionDTO{
    address: string;
    pointsPerItem: number;
    isActive: boolean;
}

interface ICollection extends ICollectionDTO, Document {}

const CollectionSchema: Schema = new Schema({
    address: {type: String, required: true},
    pointsPerItem: {type: Number, required: true},
    isActive: {type: Boolean, required: true},
}, {
    timestamps: true
})

const Collections = mongoose.model<ICollection>('Collections', CollectionSchema);
export default Collections;

