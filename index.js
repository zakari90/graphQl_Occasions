import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from './models/user.js';
import resolvers from './resovers/index.js';
import typeDefs from './schema/index.js';
import { WebSocketServer } from 'ws';
import cors from "cors"
import { makeExecutableSchema } from '@graphql-tools/schema';
import  {useServer} from 'graphql-ws/lib/use/ws'

dotenv.config();

async function startServer() {
    const app = express();
    const httpServer = createServer(app);
    
    const PORT = process.env.PORT || 4000;
app.use(cors({
        origin: '*',
        credentials: true,
    }));

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers})
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    })
    const serverCleanup = useServer({ schema }, wsServer)
    const server = new ApolloServer({
        schema,
        context: async ({ req }) => {
            const auth = req ? req.headers.authorization : null
            if (auth) {
                const decodedToken = jwt.verify(
                    auth.slice(4), process.env.JWT_SECRET
                )
                const user = await User.findById(decodedToken.id)
                console.log("--------------------------*", user);
                
                return { user }
            }
        },
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            serverCleanup.dispose()
                        }
                    }
                }
            }
        ],    });

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
