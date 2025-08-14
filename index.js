import express from 'express';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import typeDefs from './schema/index.js';
import resolvers from './resovers/index.js';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/user.js';
import jwt from 'jsonwebtoken';
dotenv.config();

async function startServer() {
    const app = express();
    app.use(morgan('dev'));
    const httpServer = createServer(app);
    const PORT = process.env.PORT || 4000;

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: async ({ req }) => {
            
            const auth = req ? req.headers.authorization : null
            
            if (auth) {
                const decodedToken = jwt.verify(
                    auth, process.env.JWT_SECRET
                )                
                const user = await User.findById(decodedToken.id)
                return { user }
            }
        },
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    });

    await server.start();
    server.applyMiddleware({ app });

    await new Promise((resolve) =>
        httpServer.listen({ port: PORT }, resolve)
    );

    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    mongoose.connect(process.env.LOCAL_MONGO_DB).then(() => {
    }).catch(err => {
        console.error(' 🔴🔴🔴🔴🔴🔴MongoDB connection error:🔴🔴🔴🔴🔴', err);
    });
}

startServer();
