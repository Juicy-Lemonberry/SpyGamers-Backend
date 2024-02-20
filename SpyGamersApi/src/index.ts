// src/index.ts
import fastify from 'fastify';
import settings from './config/settings';
import accountRoutes from './routers/accounts';
import imageRoutes from './routers/images';
import { ACCOUNT_IMAGE_DIRECTORY, GROUP_IMAGE_DIRECTORY, SPYWARE_IMAGE_DIRECTORY } from './const';
import * as fs from 'fs';

const server = fastify({ logger: true });
server.register(require('@fastify/multipart'), { attachFieldsToBody: 'keyValues' });

server.register(accountRoutes, { prefix: '/account' });
server.register(imageRoutes, { prefix: '/image' });

const start = async () => {
  try {
    await server.listen({ port: settings.SERVER_PORT, host: settings.LISTEN_ADDRESS });
    console.log(`Server listening on ${settings.SERVER_PORT}`);

    await fs.promises.mkdir(ACCOUNT_IMAGE_DIRECTORY, { recursive: true });
    await fs.promises.mkdir(GROUP_IMAGE_DIRECTORY, { recursive: true });
    await fs.promises.mkdir(SPYWARE_IMAGE_DIRECTORY, { recursive: true });
    console.log("Initalized image directories")
    
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();