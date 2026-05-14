require("dotenv").config();

const app = require("./src/app");

const connectToDB = require("./src/config/database");


connectToDB();

async function startServer() {
  try {
    // Start Express Server
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });

  } catch (error) {
    console.log("Server Startup Error:", error);
  }
}

startServer(); 