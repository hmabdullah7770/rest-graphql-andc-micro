import "dotenv/config";
import { DB_CONNECTTION } from "./config/db/index.js";
import { initializeApp } from "./app.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to database
    await DB_CONNECTTION();

    // Initialize app with Apollo middleware
    const app = await initializeApp();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(
        `GraphQL endpoint available at http://localhost:${PORT}/graphql`
      );
    });
  } catch (error) {
    console.log("ERROR :", error);
    process.exit(1);
  }
}

// Run the server
startServer();
