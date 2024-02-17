import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const saltRounds = 10;

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, email, password } = request.body as { username: string; email: string; password: string };

    if (password.length < 4) {
        return reply.status(400).send({ error: "Password is too short. It must be at least 4 characters long." });
    }

    if (password.length > 16) {
        return reply.status(400).send({ error: "Password is too long. It must be no more than 16 characters long." });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
        const account = await prisma.account.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
            },
        });

        // TODO: SMTP to verify email.

        reply.status(201).send({ status: "SUCCESS" });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {

            const isUniqueConstraintViolation = error.code === "P2002";
            if (isUniqueConstraintViolation) {
                return reply.status(400).send({ status: `${error.meta?.target}_TAKEN`.toUpperCase() });
            }
        }

        reply.status(500).send({ status: "FAILURE" });
    }
};

export const registerSchema = {
    type: 'object',
    required: ['username', 'email', 'password'],
    properties: {
        username: { type: 'string' },
        password: { type: 'string' },
        email: { type: 'string' },
    },
};