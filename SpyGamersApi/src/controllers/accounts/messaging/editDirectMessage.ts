import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';
import { isStringEmptyOrWhitespace } from '../../../utils/isStringEmptyOrWhitespace';

const prisma = new PrismaClient();

export const editDirectMessage = async (request: FastifyRequest, reply: FastifyReply) => {
    const { auth_token, message_id, new_content } = request.body as { 
        auth_token: string;
        message_id: number;
        new_content: string;
    };

    try {
        if (isStringEmptyOrWhitespace(new_content)){
            return reply.status(406).send({ status: "EMPTY_CONTENT" });
        }

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "FAILURE" });
        }

        const targetMessage = await prisma.directMessage.findFirst({
            where: {
                id: message_id
            }
        });

        if (targetMessage == null) {
            return reply.status(406).send({ status: "MESSAGE_NOT_FOUND" });
        }

        if (targetMessage.sender_id != account.id) {
            return reply.status(406).send({ status: "NOT_MESSAGE_AUTHOR" });
        }

        await prisma.directMessage.update({
            data: {
                content: new_content
            },
            where: {
                id: message_id
            }
        });

        return reply.status(201).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    }
};


export const editDirectMessageSchema = {
    body: {
        type: 'object',
        required: ['auth_token', 'message_id', 'new_content'],
        properties: {
            auth_token: {
                type: 'string'
            },
            message_id: {
                type: 'number'
            },
            new_content: {
                type: 'string'
            }
        }
      }
};
