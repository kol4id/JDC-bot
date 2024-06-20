import TonConnect from "@tonconnect/sdk";
import { TonConnectStorage } from "./storage";
import * as process from 'process';

type StoredConnectorData = {
    connector: TonConnect;
    timeout: ReturnType<typeof setTimeout>;
    onConnectorExpired: ((connector: TonConnect) => void)[];
}
const manifets = process.env.MANIFEST_URL;
const connectors = new Map<number, StoredConnectorData>();

export function getConnector(chatId: number, onConnectorExpired?: (connector: TonConnect) => void): TonConnect{
    let storedItem: StoredConnectorData;
    if (connectors.has(chatId)){
        storedItem = connectors.get(chatId)!;
        clearTimeout(storedItem.timeout);
    } else {
        storedItem = {
            connector: new TonConnect({
                storage: new TonConnectStorage(chatId),
                manifestUrl: manifets
            }),
            onConnectorExpired: []
        } as any as StoredConnectorData;
    }

    if (onConnectorExpired){
        storedItem.onConnectorExpired.push(onConnectorExpired);
    }

    storedItem.timeout = setTimeout(() => {
        if (connectors.has(chatId)) {
            const storedItem = connectors.get(chatId)!;
            storedItem.connector.pauseConnection();
            storedItem.onConnectorExpired.forEach(callback => callback(storedItem.connector));
            connectors.delete(chatId)
        }
    }, Number(process.env.CONNECTOR_TTL_MS));

    connectors.set(chatId, storedItem);
    return storedItem.connector;
}