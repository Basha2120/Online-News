import { MongoClient } from "mongodb";

let client;

export async function getDb() {
    if (!client) {
        const uri = process.env.MONGODB_URI;
        client = new MongoClient(uri);
        await client.connect();
    }
    const dbName = process.env.MONGODB_DB || "newspaper_saas";
    return client.db(dbName);
}

export async function closeDb() {
    if (client) {
        await client.close();
        client = null;
    }
}
