import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';

export const deleteGamePreference = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, preference_id } = request.body as { auth_token: string; preference_id: number; };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "FAILURE" });
        }

        const existingGame = await prisma.gamePreference.findFirst({
            where: {
                id: preference_id,
            }
        });

        if (existingGame == null){
            return reply.status(406).send({ status: "PREFERENCE_NOT_EXISTS" });
        }

        if (existingGame.account_id != account.id){
            return reply.status(406).send({ status: "NOT_SELF_PREFERENCE" });
        }

        await prisma.gamePreference.delete({
            where: {
                id: preference_id
            }
        })

        return reply.status(201).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const deleteGamePreferenceSchema = {
    type: 'object',
    required: ['auth_token', 'preference_id'],
    properties: {
        auth_token: { type: 'string' },
        preference_id: { type: 'number' }
    },
};