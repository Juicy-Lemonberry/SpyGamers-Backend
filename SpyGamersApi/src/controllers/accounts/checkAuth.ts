import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

export const checkAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    try {
        const { auth_token } = request.body as { auth_token: string; }
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        return reply.status(201).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const checkAuthSchema = {
    type: 'object',
    required: ['auth_token'],
    properties: {
        auth_token: { type: 'string' }
    },
};