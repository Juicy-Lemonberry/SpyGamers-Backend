import { FastifyInstance } from 'fastify';

import * as getAccountPictureController from '../controllers/images/getAccountPicture';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
  fastify.get('/get-account-picture', { schema: { querystring: getAccountPictureController.getAccountPictureSchema } }, getAccountPictureController.getAccountPicture);

  done();
}