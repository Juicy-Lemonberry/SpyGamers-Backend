import { FastifyInstance } from 'fastify';

import { createGroup, createGroupSchema } from '../controllers/groups/create-group';

export default function (fastify: FastifyInstance, opts: any, done: Function) {

  fastify.post('/create-group', { schema: { body: createGroupSchema } }, createGroup);

  done();
}