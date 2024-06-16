import { Model } from "mongoose";
import Users from "./schemas/user.schema";


export class UserRepository {
    constructor(private usersModel: typeof Users){}

    
}