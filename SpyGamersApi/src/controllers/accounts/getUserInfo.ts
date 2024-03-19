import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';

export const getUserInfo = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    try {
        const { account_id } = request.query as { account_id: number; };

        const user = await prisma.account.findFirst({
            where: {
                id: account_id
            }
        })

        if (!user) {
            return reply.status(200).send({ status: "NO_USERS_FOUND" });
        }

        const resultData = {
            id: user.id,
            username: user.username,
            date_created: user.created_at,
            timezone_code: user.timezone_code
        }

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

export const getUserInfoSchema = {
    type: 'object',
    properties: {
        querystring: {
            type: 'object',
            required: ['account_id'],
            properties: {
                account_id: { type: 'number' }
            }
        }
    },
};
