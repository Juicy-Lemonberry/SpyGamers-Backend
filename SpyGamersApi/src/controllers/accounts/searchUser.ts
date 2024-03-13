import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const searchUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, case_sensitive = false } = request.query as { username: string; case_sensitive?: boolean };

    try {
        const users = await prisma.account.findMany({
            where: {
                username: {
                    contains: `%${username}%`,
                    mode: case_sensitive ? Prisma.QueryMode.default : Prisma.QueryMode.insensitive
                }
            },
            select: {
                id: true,
                username: true,
                created_at: true
            }
        });

        if (users.length === 0) {
            return reply.status(200).send({ status: "NO_USERS_FOUND" });
        }

        reply.status(200).send({ 
            status: "SUCCESS",
            result: users.map(user => ({
                id: user.id,
                username: user.username,
                date_created: user.created_at
            }))
        });
    } catch (error) {
        reply.status(500).send({ status: "FAILURE", exists: false });
    }
}

export const searchUsersSchema = {
    type: 'object',
    properties: {
        querystring: {
            type: 'object',
            required: ['username'],
            properties: {
                username: { type: 'string' },
                case_sensitive: { type: 'boolean' }
            }
        }
    },
};
