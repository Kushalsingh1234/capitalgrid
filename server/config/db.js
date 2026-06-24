import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/capitalgrid');
    console.log(`[CapitalGrid DB] MongoDB Connected: ${conn.connection.host}`);
    global.useMockDb = false;
  } catch (error) {
    console.warn(`[CapitalGrid DB Warning] Local MongoDB connection refused: ${error.message}`);
    console.warn(`[CapitalGrid DB Warning] Initializing in-memory Mock Database fallback. Data will NOT persist on restart.`);
    global.useMockDb = true;
    global.mockUsers = [];
    global.mockStartups = [];
    global.mockMarketplace = [];
    global.mockTransactions = [];
    global.mockEmployees = [];
  }
};

export default connectDB;
