import { FastifyInstance } from 'fastify';

import { createGroup, createGroupSchema } from '../controllers/groups/create-group';
import { getAccountGroups, getAccountGroupsSchema } from '../controllers/groups/get-account-groups';
import { getGroupMessages, getGroupMessagesSchema } from '../controllers/groups/get-group-messages';

export default function (fastify: FastifyInstance, opts: any, done: Function) {

  fastify.post('/create-group', { schema: { body: createGroupSchema } }, createGroup);
  fastify.post('/get-account-groups', { schema: { body: getAccountGroupsSchema}}, getAccountGroups);
  fastify.post('/get-group-messages', { schema: { body: getGroupMessagesSchema}}, getGroupMessages);

  done();
}