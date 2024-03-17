import { FastifyInstance } from 'fastify';

import { createGroup, createGroupSchema } from '../controllers/groups/create';
import { getAccountGroups, getAccountGroupsSchema } from '../controllers/groups/getAccountGroups';
import { getGroupMessages, getGroupMessagesSchema } from '../controllers/groups/getMessages';
import { getGroupMembers, getGroupMembersSchema } from '../controllers/groups/getMembers';
import { sendGroupMessage, sendGroupMessageSchema } from '../controllers/groups/sendMessage';
import { editGroupMessage, editGroupMessageSchema } from '../controllers/groups/editMessage';
import { deleteGroupMessage, deleteGroupMessageSchema } from '../controllers/groups/deleteMessage';
import { addMember, addMemberSchema } from '../controllers/groups/addMember';
import { removeMember, removeMemberSchema } from '../controllers/groups/removeMember';
import { toggleMemberAdmin, toggleMemberAdminSchema } from '../controllers/groups/toggleMemberAdmin';
import { setIcon, setIconSchema } from '../controllers/groups/setIcon';
import { changeInformationSchema, changeInformation } from '../controllers/groups/changeInformation';
import { joinGroup, joinGroupSchema } from '../controllers/groups/join';

export default function (fastify: FastifyInstance, opts: any, done: Function) {

  fastify.post('/create', { schema: { body: createGroupSchema } }, createGroup);
  fastify.post('/get-account-groups', { schema: { body: getAccountGroupsSchema}}, getAccountGroups);

  // Messaging related...
  fastify.post('/get-messages', { schema: { body: getGroupMessagesSchema}}, getGroupMessages);
  fastify.post('/send-message', { schema: { body: sendGroupMessageSchema }}, sendGroupMessage);
  fastify.put('/edit-message', { schema: { body: editGroupMessageSchema }}, editGroupMessage);
  fastify.delete('/delete-message', { schema: { body: deleteGroupMessageSchema}}, deleteGroupMessage);

  // Members management...
  fastify.post('/get-members', {schema: { body: getGroupMembersSchema}}, getGroupMembers);
  fastify.post('/add-member', { schema: {body: addMemberSchema}}, addMember);
  fastify.delete('/remove-member', { schema: { body: removeMemberSchema}}, removeMember);
  fastify.put('/toggle-admin',  {schema :{ body: toggleMemberAdminSchema}}, toggleMemberAdmin);
  fastify.post('/join', { schema: { body: joinGroupSchema }}, joinGroup);

  // Group Management Related
  fastify.put('/set-icon', { schema: {body: setIconSchema}}, setIcon);
  fastify.put('/change-information', {schema: { body:changeInformationSchema}}, changeInformation)

  done();
}