import { Context } from "telegraf";
import { allowedUsers } from "../states";

export const accessGuard = (ctx: Context): boolean =>{
    return allowedUsers.includes(ctx.from?.id!)
}