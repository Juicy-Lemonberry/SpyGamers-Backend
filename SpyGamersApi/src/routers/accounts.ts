import { FastifyInstance } from 'fastify';
import * as registerController from '../controllers/accounts/register';
import * as loginController  from '../controllers/accounts/login';
import * as searchUserController from '../controllers/accounts/searchUser';
import * as changeProfilePictureController from '../controllers/accounts/changeProfilePicture';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
  fastify.post('/register', { schema: { body: registerController.registerSchema } }, registerController.register);
  fastify.post('/login', { schema: { body: loginController.loginSchema } }, loginController.login);
  fastify.get('/search-user', { schema: { querystring: searchUserController.searchUserSchema } }, searchUserController.searchUser);
  fastify.put('/change-profile-picture', { schema: { body: changeProfilePictureController.changeProfilePictureSchema }}, changeProfilePictureController.changeProfilePicture);

  done();
}