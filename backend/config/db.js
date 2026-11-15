const mongoose = require('mongoose');
const dns = require('dns');

// On Windows, the local router DNS often rejects SRV queries (querySrv ECONNREFUSED).
// Using public Google and Cloudflare DNS resolvers fixes Atlas connection reliably.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('Could not set custom DNS servers:', e.message);
}

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mailpilot';

    // Connect to MongoDB Atlas
    try {
      console.log('Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(uri, {
        tlsAllowInvalidCertificates: true,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
      setupListeners();
      return conn;
    } catch (initialErr) {
      console.warn(`⚠️  Could not connect to Atlas: ${initialErr.message}`);
      console.log('🔄 Falling back to in-memory MongoDB (mongodb-memory-server)...');
    }

    // Fallback: use mongodb-memory-server if Atlas ever fails
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB In-Memory Connected: ${conn.connection.host}/${conn.connection.name}`);
    console.log('⚠️  Data will not persist between restarts.');

    // Cleanup on exit
    process.on('SIGINT', async () => { await mongod.stop(); process.exit(0); });
    process.on('SIGTERM', async () => { await mongod.stop(); process.exit(0); });

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
