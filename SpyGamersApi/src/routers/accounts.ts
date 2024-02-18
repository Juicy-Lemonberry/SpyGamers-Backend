import { FastifyInstance } from 'fastify';
import * as registerController from '../controllers/accounts/register';
import * as loginController  from '../controllers/accounts/login';


export default function (fastify: FastifyInstance, opts: any, done: Function) {
  fastify.post('/register', { schema: { body: registerController.registerSchema } }, registerController.register);
  fastify.post('/login', { schema: { body: loginController.loginSchema } }, loginController.login);

  done();
}