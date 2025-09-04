import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function connectToMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!process.env.MONGODB_URI_NEW) {
    throw new Error('MONGODB_URI_NEW environment variable is not set');
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI_NEW);
    await client.connect();
    db = client.db('mgprofilev1');
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function disconnectFromMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Auto-disconnect when the function context ends
process.on('beforeExit', async () => {
  await disconnectFromMongoDB();
});
