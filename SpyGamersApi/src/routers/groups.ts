import { FastifyInstance } from 'fastify';

import { createGroup, createGroupSchema } from '../controllers/groups/create-group';
import { getAccountGroups, getAccountGroupsSchema } from '../controllers/groups/get-account-groups';
import { getGroupMessages, getGroupMessagesSchema } from '../controllers/groups/get-group-messages';
import { getGroupMembers, getGroupMembersSchema } from '../controllers/groups/get-group-members';
import { sendGroupMessage, sendGroupMessageSchema } from '../controllers/groups/send-group-message';
import { editGroupMessage, editGroupMessageSchema } from '../controllers/groups/edit-group-message';
import { deleteGroupMessage, deleteGroupMessageSchema } from '../controllers/groups/delete-group-message';

export default function (fastify: FastifyInstance, opts: any, done: Function) {

  fastify.post('/create', { schema: { body: createGroupSchema } }, createGroup);
  fastify.post('/get-account-groups', { schema: { body: getAccountGroupsSchema}}, getAccountGroups);
  fastify.post('/get-members', {schema: { body: getGroupMembersSchema}}, getGroupMembers);

  // Messaging related...
  fastify.post('/get-messages', { schema: { body: getGroupMessagesSchema}}, getGroupMessages);
  fastify.post('/send-message', { schema: { body: sendGroupMessageSchema }}, sendGroupMessage);
  fastify.put('/edit-message', { schema: { body: editGroupMessageSchema }}, editGroupMessage);
  fastify.delete('/delete-message', { schema: { body: deleteGroupMessageSchema}}, deleteGroupMessage);

  done();
}