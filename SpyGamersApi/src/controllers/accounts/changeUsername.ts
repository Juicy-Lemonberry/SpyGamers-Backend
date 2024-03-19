import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';


export const changeUsername = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    try {
        const { auth_token, new_username } = request.body as { auth_token: string; new_username: string; };
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(200).send({ status: "BAD_AUTH" });
        }

        const existingUser = await prisma.account.findFirst({
            where: {
                username: new_username,
            },
        });

        if (existingUser != null) {
            return reply.status(200).send({ status: "USERNAME_TAKEN" });
        }

        await prisma.account.update({
            data: {
                username: new_username
            },
            where: {
                id: account.id
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


export const changeUsernameSchema = {
    type: 'object',
    required: ['auth_token', 'new_username'],
    properties: {
        auth_token: { type: 'string' },
        new_username: { type: 'string' }
    },
};