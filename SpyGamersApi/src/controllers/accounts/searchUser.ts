import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const searchUser = async (request: FastifyRequest, reply: FastifyReply) => {
    const { username } = request.query as { username: string; };

    try {
        const account = await prisma.account.findUniqueOrThrow({
            where: {
                username: username,
            },
        });

        reply.status(200).send({ 
            status: "SUCCESS",
            exists: true,
            username: username,
            date_created: account.created_at
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return reply.status(404).send({ status: "USER_NOT_FOUND", exists : false });
        }

        reply.status(500).send({ status: "FAILURE", exists: false });
    }
};

export const searchUserSchema = {
    type: 'object',
    properties: {
        querystring: {
            type: 'object',
            required: ['username'],
            properties: {
                username: { type: 'string' }
            }
        }
    },
};
