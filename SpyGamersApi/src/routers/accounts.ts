import { FastifyInstance } from 'fastify';
import * as registerController from '../controllers/accounts/register';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
  fastify.post('/register', { schema: { body: registerController.registerSchema } }, registerController.register);

  done();
}