import * as fs from 'fs'

interface IState{
    allowedUsers: number[]
}
enum Tier{
    bronze = 'bronze',
    silver = 'silver',
    gold = 'gold',
    platinum = 'platinum',
    diamond = 'diamond'
}


export enum majorStage{
    coinCreate = 'coinCreate',
    coinEdit = 'coinEdit',
    collectionCreate = 'collectionCreate',
    collectionEdit = 'collectionEdit'
}

export let allowedUsers: number[] = [];
export const userStage: Map<number, string> = new Map();

export function initState(){
    const file = fs.readFileSync('states.json', 'utf8');
    const state: IState = JSON.parse(file);
    allowedUsers = state.allowedUsers;
}

export function getTier(points: number){
    if(points <= 10) return Tier.bronze
    if(points <= 24) return Tier.silver
    if(points <= 54) return Tier.gold
    if(points <= 99) return Tier.platinum
    return Tier.gold
}

