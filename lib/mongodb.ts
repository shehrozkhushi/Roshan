import { Db, MongoClient } from "mongodb";

const databaseName = process.env.MONGODB_DB?.trim() || "roshan_studio";

declare global {
  var roshanMongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8_000,
  });

  return client.connect();
}

export function getMongoClient() {
  if (process.env.NODE_ENV === "development") {
    global.roshanMongoClientPromise ??= createClientPromise();
    return global.roshanMongoClientPromise;
  }

  global.roshanMongoClientPromise ??= createClientPromise();
  return global.roshanMongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(databaseName);
}
