import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';

import { distance, closest } from 'fastest-levenshtein';

export const searchUsers = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    try {
        const { username, case_sensitive = false } = request.query as { username: string; case_sensitive?: boolean };
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
                created_at: true,
                timezone_code: true
            }
        });

        if (users.length === 0) {
            return reply.status(200).send({ status: "NO_USERS_FOUND" });
        }

        const resultData = users
            .map(user => ({
                id: user.id,
                username: user.username,
                date_created: user.created_at,
                timezone_code: user.timezone_code
            }))
            .sort((a, b) => distance(a.username, username) - distance(b.username, username))

        reply.status(200).send({
            status: "SUCCESS",
            result: resultData
        });
    } catch (error) {
        reply.status(500).send({ status: "FAILURE", exists: false });
    } finally {
        await prisma.$disconnect();
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
