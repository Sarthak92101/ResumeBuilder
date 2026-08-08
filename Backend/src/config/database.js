const mongoose = require("mongoose")

async function connectToDB() {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri || mongoUri.includes("example.com") || mongoUri.includes("<username>")) {
    throw new Error(
      "Invalid MONGO_URI. Set a real MongoDB connection string in Backend/.env (local: mongodb://127.0.0.1:27017/interview-master)."
    )
  }

  await mongoose.connect(mongoUri)
  console.log("Database connected")
}

module.exports = connectToDB
