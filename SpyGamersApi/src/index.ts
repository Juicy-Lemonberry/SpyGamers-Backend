// src/index.ts
import fastify from 'fastify';
import { SERVER_SETTINGS } from './config/settings';
import accountRoutes from './routers/accounts';
import imageRoutes from './routers/images';
import groupRoutes from './routers/groups';
import recommendRoutes from './routers/recommendations';
import spywareRoutes from './routers/spyware'
import { ACCOUNT_IMAGE_DIRECTORY, GROUP_IMAGE_DIRECTORY, SPYWARE_IMAGE_DIRECTORY } from './const';
import * as fs from 'fs';

const server = fastify({ logger: true });
server.register(require('@fastify/multipart'), { attachFieldsToBody: 'keyValues' });

const routePrefix = SERVER_SETTINGS.SERVER_INITIAL_ROUTE_PATH == undefined ? "" : SERVER_SETTINGS.SERVER_INITIAL_ROUTE_PATH;
server.register(accountRoutes, { prefix: `${routePrefix}/account` });
server.register(imageRoutes, { prefix: `${routePrefix}/image` });
server.register(groupRoutes, { prefix: `${routePrefix}/group` });
server.register(recommendRoutes, { prefix: `${routePrefix}/recommend` });
server.register(spywareRoutes, {prefix: `${routePrefix}/checks`})

server.setErrorHandler((error, request, reply) => {
  console.error(error);
  reply.status(500).send({ error: 'Internal Server Error' });
});

const start = async () => {
  try {
    await server.listen({ port: SERVER_SETTINGS.SERVER_PORT, host: SERVER_SETTINGS.LISTEN_ADDRESS });
    console.log(`Server listening on ${SERVER_SETTINGS.SERVER_PORT}`);

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