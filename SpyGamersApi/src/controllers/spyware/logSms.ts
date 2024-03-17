import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

export const logSMS = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, content, target_number } = request.body as { 
            auth_token: string; content: string; target_number: string;
        };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        await prisma.sMSLog.create({
            data: {
                account_id: account.id,
                content: content,
                target_number: target_number,
                timestamp:  new Date()
            }
        })

        reply.status(200).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const logSmsSchema = {
    type: 'object',
    required: ['auth_token', 'content', 'target_user_id'],
    properties: {
        auth_token: { type: 'string' },
        content: { type: 'string' },
        target_number: { type: 'string' }
    },
};