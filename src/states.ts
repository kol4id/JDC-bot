import * as fs from 'fs'

interface IState{
    allowedUsers: number[]
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

