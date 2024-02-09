// src/index.ts
import fastify from 'fastify';

const server = fastify({ logger: true });

import { PrismaClient } from '@prisma/client';


server.get('/', async (request, reply) => {
  return { hello: 'world' };
});

const start = async () => {
  try {
    await server.listen({ port: 3000 });
    console.log(`Server listening on 3000`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();