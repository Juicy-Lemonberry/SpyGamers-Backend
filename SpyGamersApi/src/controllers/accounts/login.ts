import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

export const login = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { username, password } = request.body as { username: string; password: string };
        // Find the account by username
        const account = await prisma.account.findUniqueOrThrow({
            where: {
                username: username, 
            },
        });

        // Verify the password
        const match = await bcrypt.compare(password, account.password);
        if (!match) {
            return reply.status(200).send({ status: "PASSWORD_INVALID" });
        }

        const sessionToken = randomBytes(32).toString('hex');

        // Expiry set to 1 month from creation
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        await prisma.session.create({
            data: {
                token: sessionToken,
                expiry_date: expiryDate,
                accountId: account.id,
            },
        });


        reply.status(201).send({ status: "SUCCESS", session_token: sessionToken, account_id: account.id, timezone_code: account.timezone_code  });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return reply.status(200).send({ status: `USERNAME_INVALID` });
        }

        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};

export const loginSchema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: { type: 'string' },
        password: { type: 'string' }
    },
};