import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DB_FILE = path.join(__dirname, '../backend/src/database/data.json');
const ENV_FILE = path.join(__dirname, '../backend/.env');

const COLLECTIONS = [
  'users',
  'events',
  'clubs',
  'registrations',
  'savedEvents',
  'comments',
  'notifications',
  'announcements',
  'resources',
  'club_members',
  'user_settings',
  'conversations',
  'participants',
  'messages',
  'joinRequests',
  'auditLogs'
];

function getPrimaryKeyField(item) {
  if (item && typeof item === 'object') {
    if ('id' in item) return 'id';
    if ('messageId' in item) return 'messageId';
    if ('userId' in item) return 'userId';
  }
  return null;
}

async function migrate() {
  console.log('--- STARTING DATABASE MIGRATION ---');

  // Load MONGO_URI
  let mongoUri = process.env.MONGO_URI;
  if (!mongoUri && fs.existsSync(ENV_FILE)) {
    const envContent = fs.readFileSync(ENV_FILE, 'utf8');
    const match = envContent.match(/MONGO_URI\s*=\s*(.*)/);
    if (match && match[1]) {
      mongoUri = match[1].trim();
    }
  }

  if (!mongoUri) {
    console.error('ERROR: MONGO_URI is not set in environment or backend/.env file.');
    process.exit(1);
  }

  console.log('Target MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//****:****@'));

  // Load local data.json
  if (!fs.existsSync(DB_FILE)) {
    console.error('ERROR: Local database file not found at:', DB_FILE);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(raw);
  console.log('Successfully loaded local data.json.');

  // Connect to Atlas
  let client;
  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas.');
  } catch (err) {
    console.error('ERROR: Failed to connect to MongoDB Atlas:', err);
    process.exit(1);
  }

  const mongoDb = client.db();

  // Sync Metadata Flags
  try {
    await mongoDb.collection('system_metadata').updateOne(
      { _id: 'migration_flags' },
      {
        $set: {
          registrationsMigrated: db.registrationsMigrated || false,
          passwordsMigrated: db.passwordsMigrated || false,
          messagesMigrated: db.messagesMigrated || false
        }
      },
      { upsert: true }
    );
    console.log('Synced system metadata flags.');
  } catch (err) {
    console.error('Error syncing system metadata flags:', err);
  }

  const localCounts = {};
  const migratedCounts = {};

  // Migrate each collection
  for (const colName of COLLECTIONS) {
    const array = db[colName] || [];
    localCounts[colName] = array.length;
    console.log(`Migrating collection: "${colName}" (${array.length} records)...`);

    try {
      // Clear the collection in Atlas
      await mongoDb.collection(colName).deleteMany({});

      if (array.length > 0) {
        // Prepare clean documents without _id if any exist to prevent write failures
        const docs = array.map(item => {
          const doc = { ...item };
          delete doc._id;
          return doc;
        });
        await mongoDb.collection(colName).insertMany(docs);
      }

      // Query database count to verify
      const count = await mongoDb.collection(colName).countDocuments();
      migratedCounts[colName] = count;
      
      if (count === localCounts[colName]) {
        console.log(`✓ Verification passed for "${colName}": ${count} records migrated.`);
      } else {
        console.warn(`⚠ Verification warning for "${colName}": local count (${localCounts[colName]}) does not match Atlas count (${count}).`);
      }
    } catch (err) {
      console.error(`ERROR: Failed to migrate collection "${colName}":`, err);
    }
  }

  await client.close();
  console.log('\n--- MIGRATION REPORT ---');
  console.table(
    COLLECTIONS.map(col => ({
      Collection: col,
      'Local Count': localCounts[col],
      'Atlas Count': migratedCounts[col],
      Status: localCounts[col] === migratedCounts[col] ? 'Match' : 'Mismatch'
    }))
  );
  console.log('------------------------');
  console.log('Migration process completed.');
}

migrate().catch(console.error);
