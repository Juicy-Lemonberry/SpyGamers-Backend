import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const getGamePreference = async (request: FastifyRequest, reply: FastifyReply) => {
    const { target_username_id } = request.query as { target_username_id: string; };

    try {
        const account = await prisma.account.findUniqueOrThrow({
            where: {
                id: parseInt(target_username_id),
            },
        });

        const gamePreferences = await prisma.gamePreference.findMany({
            where: {
                account_id: account.id
            }
        })

        const minifiedGamePreferenceData = gamePreferences.map((preference) => ({
            game_preference_id: preference.id,
            game_name: preference.name
        }));

        reply.status(200).send({ 
            status: "SUCCESS",
            preferences: minifiedGamePreferenceData
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return reply.status(404).send({ status: "USER_NOT_FOUND", exists : false });
        }

        reply.status(500).send({ status: "FAILURE", exists: false });
    }
};


export const getGamePreferenceSchema = {
    type: 'object',
    properties: {
        querystring: {
            type: 'object',
            required: ['target_username_id'],
            properties: {
                target_username_id: { type: 'number' }
            }
        }
    },
};