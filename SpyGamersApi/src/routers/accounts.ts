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

export default function (fastify: FastifyInstance, opts: any, done: Function) {
  // Base stuff
  fastify.post('/register', { schema: { body: registerController.registerSchema } }, registerController.register);
  fastify.post('/login', { schema: { body: loginController.loginSchema } }, loginController.login);
  fastify.get('/search-user', { schema: { querystring: searchUserController.searchUserSchema } }, searchUserController.searchUser);

  // User configurations...
  fastify.put('/change-profile-picture', { schema: { body: changeProfilePictureController.changeProfilePictureSchema }}, changeProfilePictureController.changeProfilePicture);
  fastify.put('/change-username', { schema: { body: changeUsernameController.changeUsernameSchema } }, changeUsernameController.changeUsername);
  fastify.post('/set-timezone', { schema: { body: setTimezoneController.setTimezoneSchema } }, setTimezoneController.setTimezone);

  // Friend requests related...
  fastify.post('/send-friend-request', { schema: {body: sendFriendRequestController.sendFriendRequestSchema}}, sendFriendRequestController.sendFriendRequest)
  fastify.post('/get-friends', { schema: { body: getFriendsController.getFriendsSchema}}, getFriendsController.getFriends)
  fastify.put('/remove-friend', { schema: { body: removeFriendController.removeFriendSchemas }}, removeFriendController.removeFriend)

  // Direct Message Related...
  fastify.post('/send-direct-message', { schema: {body: sendDirectMessageController.sendDirectMessageSchema}}, sendDirectMessageController.sendDirectMessage)
  fastify.post('/get-direct-messages', { schema: { body: getDirectMessagesController.getDirectMessagesSchema}}, getDirectMessagesController.getDirectMessages)

  done();
}