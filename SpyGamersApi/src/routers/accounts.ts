import { FastifyInstance } from 'fastify';
import * as registerController from '../controllers/accounts/register';
import * as loginController  from '../controllers/accounts/login';
import * as searchUserController from '../controllers/accounts/searchUser';
import * as changeProfilePictureController from '../controllers/accounts/changeProfilePicture';
import * as changeUsernameController from '../controllers/accounts/changeUsername';
import * as setTimezoneController from '../controllers/accounts/setTimezone';

import * as sendFriendRequestController from '../controllers/accounts/friendships/sendFriendRequest';
import * as getFriendsController from '../controllers/accounts/friendships/getFriends';
import * as removeFriendController from '../controllers/accounts/friendships/removeFriend';

import * as sendDirectMessageController from '../controllers/accounts/messaging/sendDirectMessage'
import * as getDirectMessagesController from '../controllers/accounts/messaging/getDirectMessages'
import * as editDirectMessageController from '../controllers/accounts/messaging/editDirectMessage'
import { deleteDirectMessageSchema, deleteDirectMessage } from '../controllers/accounts/messaging/deleteDirectMessage';
import { setGamePreferenceSchema, setGamePreference } from '../controllers/accounts/preference/setGamePreference';
import { getGamePreference, getGamePreferenceSchema } from '../controllers/accounts/preference/getGamePreference';
import { deleteGamePreference, deleteGamePreferenceSchema } from '../controllers/accounts/preference/deleteGamePreference';
import { checkAuth, checkAuthSchema } from '../controllers/accounts/checkAuth';
import { getLatestConversationSchema, getLatestConversation } from '../controllers/accounts/getLatestConversations';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
  // Base stuff
  fastify.post('/register', { schema: { body: registerController.registerSchema } }, registerController.register);
  fastify.post('/login', { schema: { body: loginController.loginSchema } }, loginController.login);
  fastify.get('/search-users', { schema: { querystring: searchUserController.searchUsersSchema } }, searchUserController.searchUsers);
  fastify.post('/check-authentication', { schema: {body: checkAuthSchema}}, checkAuth)
  fastify.post('/get-latest-conversations', { schema: {body: getLatestConversationSchema}}, getLatestConversation)

  // User configurations...
  fastify.put('/change-profile-picture', { schema: { body: changeProfilePictureController.changeProfilePictureSchema }}, changeProfilePictureController.changeProfilePicture);
  fastify.put('/change-username', { schema: { body: changeUsernameController.changeUsernameSchema } }, changeUsernameController.changeUsername);
  fastify.post('/set-timezone', { schema: { body: setTimezoneController.setTimezoneSchema } }, setTimezoneController.setTimezone);

  // Game Preference Configurations...
  fastify.post('/add-game-preference', { schema: { body: setGamePreferenceSchema }}, setGamePreference)
  fastify.delete('/delete-game-preference', { schema: { body: deleteGamePreferenceSchema }}, deleteGamePreference)
  fastify.get('/get-game-preferences', { schema: { querystring: getGamePreferenceSchema}}, getGamePreference)

  // Friend requests related...
  fastify.post('/send-friend-request', { schema: {body: sendFriendRequestController.sendFriendRequestSchema}}, sendFriendRequestController.sendFriendRequest)
  fastify.post('/get-friends', { schema: { body: getFriendsController.getFriendsSchema}}, getFriendsController.getFriends)
  fastify.put('/remove-friend', { schema: { body: removeFriendController.removeFriendSchemas }}, removeFriendController.removeFriend)

  // Direct Message Related...
  fastify.post('/send-direct-message', { schema: {body: sendDirectMessageController.sendDirectMessageSchema}}, sendDirectMessageController.sendDirectMessage)
  fastify.post('/get-direct-messages', { schema: { body: getDirectMessagesController.getDirectMessagesSchema}}, getDirectMessagesController.getDirectMessages)
  fastify.put('/edit-direct-message', { schema: { body: editDirectMessageController.editDirectMessageSchema }}, editDirectMessageController.editDirectMessage )
  fastify.delete('/delete-direct-message', { schema: { body: deleteDirectMessageSchema }}, deleteDirectMessage)

  done();
}