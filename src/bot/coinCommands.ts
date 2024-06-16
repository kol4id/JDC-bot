import { Context } from "telegraf";
import { majorStage, userStage} from "../states";
import { CoinRepository } from "../db/coin.service";
import Coins from "../db/schemas/coin.schema";
import { Address } from "ton";

const coinRepository = new CoinRepository(Coins);

export async function handleCoin(ctx: Context): Promise<void>{
    const chatId = ctx.chat?.id!;
    await ctx.sendMessage(`отправь мне данные в следующем формате\n"команда$адресс$очки за единицу$активен(y/n)"\nкоманды:\ncedit - для изменения существующей\nccreate - для создания новой\n\nпример:\ncedit$UQBvlxYuIhJmzR6pHauU3NMZpq5Xf52TZ6kuUUvPaaU3flcT$2$y\n\nccreate$UQBvlxYuIhJmzR6pHauU3NMZpq5Xf52TZ6kuUUvPaaU3flcT$2.123$n`);
    userStage.set(chatId, majorStage.coinEdit);

    // return Boolean(coin)
}

export async function handleCoinInput(ctx: Context): Promise<void>{
    const splited = ctx.text?.split('$')!;
    if (splited?.length != 4) {
        ctx.sendMessage(`отправь мне данные в следующем формате\n"команда$адресс$очки за единицу$активен(y/n)"\nкоманды:\ncedit - для изменения существующей\nccreate - для создания новой`)
    }

    switch(splited[0]){
        case 'ccreate': await addCoin(ctx, splited)
            break;
        case 'cedit': await editCoin(ctx, splited)
            break;
    }
}

export async function addCoin(ctx: Context, splited: string[]): Promise<void> {
    const chatId = ctx.chat?.id!;
    const isActive = splited[3] === 'y';
    const address = Address.parse(splited[1]).toString();

    const isExists = await coinRepository.getByAddress(address);
    if (isExists) {
        ctx.sendMessage(`монета уже существует`)
        return
    }

    const coin = await coinRepository.create({
        address: address,
        pointsPerCoin: Number(splited[2]), 
        isActive
    });

    if (!coin) {
        ctx.sendMessage(`something went wrong, check your command`)
        return
    }

    userStage.delete(chatId);
    ctx.sendMessage(`coin successfully added`)
}

export async function editCoin(ctx: Context, splited: string[]): Promise<void>{
    const chatId = ctx.chat?.id!; 
    const isActive = splited[3] === 'y';
    const address = Address.parse(splited[1]).toString();

    const isExists = await coinRepository.getByAddress(address);
    if (!isExists) {
        ctx.sendMessage(`монеты не существует`)
        return
    }

    const coin = await coinRepository.edit({
        address: address,
        pointsPerCoin: Number(splited[2]), 
        isActive
    });

    if (!coin) {
        ctx.sendMessage(`something went wrong, check your command`)
        return
    }

    userStage.delete(chatId);
    ctx.sendMessage(`coin successfully edited`)
}
