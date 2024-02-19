import { FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const saltRounds = 10;

const regexValidateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

export const register = async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, email, password } = request.body as { username: string; email: string; password: string };

    if (password.length < 4) {
        return reply.status(400).send({ status: "LONG_PASSWORD" });
    }

    if (password.length > 16) {
        return reply.status(400).send({ status: "SHORT_PASSWORD" });
    }

    if (username.length > 128) {
        return reply.status(400).send({ status: "LONG_USERNAME" });
    }

    if (!regexValidateEmail(email)) {
        return reply.status(400).send({ status: "INVALID_EMAIL" });
    }

    if (email.length > 256) {
        return reply.status(400).send({ status: "LONG_EMAIL" });
    }

    // TODO: SMTP to verify email?

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
        const account = await prisma.account.create({
            data: {
                username: username,
                email: email,
                password: hashedPassword,
            },
        });

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