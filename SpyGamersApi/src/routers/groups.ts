import { FastifyInstance } from 'fastify';

import { createGroup, createGroupSchema } from '../controllers/groups/create';
import { getAccountGroups, getAccountGroupsSchema } from '../controllers/groups/getAccountGroups';
import { getGroupMessages, getGroupMessagesSchema } from '../controllers/groups/getMessages';
import { getGroupMembers, getGroupMembersSchema } from '../controllers/groups/getMembers';
import { sendGroupMessage, sendGroupMessageSchema } from '../controllers/groups/sendMessage';
import { editGroupMessage, editGroupMessageSchema } from '../controllers/groups/editMessage';
import { deleteGroupMessage, deleteGroupMessageSchema } from '../controllers/groups/deleteMessage';

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