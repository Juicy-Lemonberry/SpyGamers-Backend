// src/index.ts
import fastify from 'fastify';
import settings from './config/settings';
import accountRoutes from './routers/accounts';

const server = fastify({ logger: true });
server.register(require('@fastify/multipart'), { attachFieldsToBody: 'keyValues' });

server.register(accountRoutes, { prefix: '/account' });

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