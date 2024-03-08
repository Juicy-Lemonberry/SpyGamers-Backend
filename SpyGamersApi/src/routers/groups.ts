import { FastifyInstance } from 'fastify';

import { createGroup, createGroupSchema } from '../controllers/groups/create-group';
import { getAccountGroups, getAccountGroupsSchema } from '../controllers/groups/get-account-groups';

export default function (fastify: FastifyInstance, opts: any, done: Function) {

  fastify.post('/create-group', { schema: { body: createGroupSchema } }, createGroup);
  fastify.post('/get-account-groups', { schema: { body: getAccountGroupsSchema}}, getAccountGroups);

  done();
}