const mongoose = require('mongoose');
const dns = require('dns');
const path = require('path');
const fs = require('fs');

// On Windows, the local router DNS often rejects SRV queries (querySrv ECONNREFUSED).
// Using public Google and Cloudflare DNS resolvers fixes Atlas connection reliably.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e.message);
}

// Local persistent directory for WiredTiger data
const dataDir = path.join(__dirname, '..', 'data', 'db');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let activeMongod = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mailpilot';

    // 1. Attempt connection to MongoDB Atlas
    try {
      console.log('Connecting to MongoDB Atlas cloud cluster...');
      const conn = await mongoose.connect(uri, {
        tlsAllowInvalidCertificates: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
      setupListeners();
      return conn;
    } catch (initialErr) {
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.warn('⚠️  MONGODB ATLAS CONNECTION NOTICE:');
      console.warn(`Could not connect to Atlas: ${initialErr.message}`);
      console.warn('Reason: Your current IP address is not whitelisted in MongoDB Atlas.');
      console.warn('To enable permanent cloud storage in Atlas:');
      console.warn('  1. Open https://cloud.mongodb.com');
      console.warn('  2. Go to "Network Access" under Security');
      console.warn('  3. Click "Add IP Address" -> Select "Allow Access from Anywhere" (0.0.0.0/0)');
      console.warn('📁 Using local persistent disk storage (backend/data/db) in the meantime.');
      console.warn('   (All created accounts, emails, and drafts are permanently saved)');
      console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // 2. Fallback: use persistent MongoMemoryServer with WiredTiger on disk
    const { MongoMemoryServer } = require('mongodb-memory-server');
    activeMongod = await MongoMemoryServer.create({
      instance: {
        dbPath: dataDir,
        storageEngine: 'wiredTiger'
      }
    });
    uri = activeMongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`✅ Local Persistent MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log(`📁 Database files saved to: ${dataDir}`);

    // Cleanup on exit
    const stopMongo = async () => {
      if (activeMongod) {
        try {
          await mongoose.disconnect();
          await activeMongod.stop();
        } catch {}
      }
      process.exit(0);
    };
    process.on('SIGINT', stopMongo);
    process.on('SIGTERM', stopMongo);

    setupListeners();
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

function setupListeners() {
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });
}

module.exports = connectDB;
