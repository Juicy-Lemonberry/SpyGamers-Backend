// src/index.ts
import fastify from 'fastify';

const server = fastify({ logger: true });

import { PrismaClient } from '@prisma/client';
import settings from './config/settings';

import accountRoutes from './routers/accounts';

server.register(accountRoutes, { prefix: '/account' });

server.get('/', async (request, reply) => {
  return { hello: 'world' };
});

const start = async () => {
  try {
    await server.listen({ port: settings.SERVER_PORT, host: settings.LISTEN_ADDRESS });
    console.log(`Server listening on ${settings.SERVER_PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();