import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';

import { isStringEmptyOrWhitespace } from '../../../utils/isStringEmptyOrWhitespace';

export const setGamePreference = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    try {
        const { auth_token, game_name } = request.body as { auth_token: string; game_name: string; };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "FAILURE" });
        }

        if (isStringEmptyOrWhitespace(game_name)) {
            return reply.status(406).send({ status: "EMPTY_GAME_PREFERENCE" });
        }

        const existingGame = await prisma.gamePreference.findFirst({
            where: {
                account_id: account.id,
                name: game_name.trim()
            }
        });

        if (existingGame != null){
            return reply.status(406).send({ status: "PREFERENCE_EXISTS" });
        }

        await prisma.gamePreference.create({
            data: {
                account_id: account.id,
                name: game_name.trim()
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


export const setGamePreferenceSchema = {
    type: 'object',
    required: ['auth_token', 'game_name'],
    properties: {
        auth_token: { type: 'string' },
        game_name: { type: 'string' }
    },
};