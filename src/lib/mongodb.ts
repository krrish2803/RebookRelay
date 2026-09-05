import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (!clientPromise) {
    const uri = process.env.DATABASE_URL;
    if (!uri) {
      throw new Error('Missing DATABASE_URL environment variable');
    }
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db('rebookrelay');
}

export default { connect: getClientPromise };
