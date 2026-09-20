const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
  try {
    console.log("Starting in-memory MongoDB server...");
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected (In-Memory Database for local testing): ${conn.connection.host}`);
    console.log(`Using Database URI: ${mongoUri}`);
    console.log(`Everything is up and running! No MongoDB installation required.`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
