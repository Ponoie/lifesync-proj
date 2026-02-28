import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifesync';

export async function connectDatabase() {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(MONGODB_URI, options);

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    console.log('💡 Tip: Using mock data mode. Set MONGODB_URI to connect to real database.');

    // Return null to indicate mock mode
    return null;
  }
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting MongoDB:', error);
  }
}
