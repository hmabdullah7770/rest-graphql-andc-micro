import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import setupSwagger from "./config/swagger.js";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { resolvers } from "./resolvers/index.js";
import { mergedGQLSchema } from './schema/index.js';

// Create Express app
const app = express();

// Setup Express middleware
app.use(cors({
    origin: process.env.CORS_URL
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Setup Swagger
setupSwagger(app);

// Create Apollo Server instance
const server = new ApolloServer({
    typeDefs: mergedGQLSchema,
    resolvers: resolvers,
    introspection: true
});

// Define root route
app.get('/', (req, res) => {
    res.send('hello');
});

// Export a function that initializes Apollo and returns the configured app
export async function initializeApp() {
    // Start Apollo Server
    await server.start();
    
    // Apply Apollo middleware to Express
    app.use('/graphql', expressMiddleware(server));
    
    return app;
}

// Export the Express app for use before Apollo is initialized
export default app;