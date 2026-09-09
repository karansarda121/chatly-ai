import mongoose from 'mongoose';

/**
 * Connects to MongoDB using MONGO_URI from the environment.
 * Exits the process if the connection fails, since the app is useless without a DB.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not set in the environment. Check your .env file.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});


mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

export default connectDB;
