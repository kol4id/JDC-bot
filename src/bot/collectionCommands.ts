import { Context } from "telegraf";
import { CollectionRepository } from "../db/collection.service";
import Collections from "../db/schemas/collection.schema";
import { majorStage, userStage } from "../states";
import { Address } from "ton";


const collectionRepository = new CollectionRepository(Collections);

export async function handleCollection(ctx: Context): Promise<void>{
    const chatId = ctx.chat?.id!;
    await ctx.sendMessage(`отправь мне данные в следующем формате\n"команда$адресс$очки за единицу$активен(y/n)"\nкоманды:\ncedit - для изменения существующей\nccreate - для создания новой\n\nпример:\ncedit$UQBvlxYuIhJmzR6pHauU3NMZpq5Xf52TZ6kuUUvPaaU3flcT$2$y\n\nccreate$UQBvlxYuIhJmzR6pHauU3NMZpq5Xf52TZ6kuUUvPaaU3flcT$2.123$n`);
    userStage.set(chatId, majorStage.collectionEdit);

    // return Boolean(coin)
}

export async function handleCollectionInput(ctx: Context): Promise<void>{
    const splited = ctx.text?.split('$')!;
    if (splited?.length != 4) {
        ctx.sendMessage(`отправь мне данные в следующем формате\n"команда$адресс$очки за единицу$активен(y/n)"\nкоманды:\ncedit - для изменения существующей\nccreate - для создания новой`)
    }

    switch(splited[0]){
        case 'ccreate': await addCollection(ctx, splited)
            break;
        case 'cedit': await editCollection(ctx, splited)
            break;
    }
}

export async function addCollection(ctx: Context, splited: string[]): Promise<void> {
    const chatId = ctx.chat?.id!;
    const isActive = splited[3] === 'y';
    const address = Address.parse(splited[1]).toString();

    const isExists = await collectionRepository.getByAddress(address);
    if (isExists) {
        ctx.sendMessage(`коллекция уже существует`)
        return
    }

    const collection = await collectionRepository.create({
        address: address,
        pointsPerItem: Number(splited[2]), 
        isActive
    });

    if (!collection) {
        ctx.sendMessage(`something went wrong, check your command`)
        return
    }

    userStage.delete(chatId);
    ctx.sendMessage(`collection successfully added`)
}

export async function editCollection(ctx: Context, splited: string[]): Promise<void>{
    const chatId = ctx.chat?.id!; 
    const isActive = splited[3] === 'y';
    const address = Address.parse(splited[1]).toString();

    const isExists = await collectionRepository.getByAddress(address);
    if (!isExists) {
        ctx.sendMessage(`коллекции не существует`)
        return
    }

    const collection = await collectionRepository.edit({
        address: address,
        pointsPerItem: Number(splited[2]), 
        isActive
    });

    if (!collection) {
        ctx.sendMessage(`something went wrong, check your command`)
        return
    }

    userStage.delete(chatId);
    ctx.sendMessage(`collection successfully edited`)
}