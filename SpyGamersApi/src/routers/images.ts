import { FastifyInstance } from 'fastify';

import * as getAccountPictureController from '../controllers/images/getAccountPicture';
import { getGroupIcon, getGroupIconSchema } from '../controllers/images/getGroupIcon';
import { getAttachmentSchema, getAttachment } from '../controllers/images/getAttachment';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
  fastify.get('/get-account-picture', { schema: { querystring: getAccountPictureController.getAccountPictureSchema } }, getAccountPictureController.getAccountPicture);
  fastify.get('/get-group-icon', { schema: { querystring: getGroupIconSchema}}, getGroupIcon);
  fastify.post('/get-attachment', { schema: { body: getAttachmentSchema}}, getAttachment);

  done();
}