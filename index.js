import express from 'express';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import typeDefs from './schema/index.js';
import resolvers from './resovers/index.js';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

async function startServer() {
    const app = express();
    app.use(morgan('dev'));
    const httpServer = createServer(app);
    const PORT = process.env.PORT || 4000;

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();
    server.applyMiddleware({ app });

    await new Promise((resolve) =>
        httpServer.listen({ port: PORT }, resolve)
    );

    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
}

startServer();
