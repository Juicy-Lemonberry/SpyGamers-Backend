import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';

const prisma = new PrismaClient();

export const deleteDirectMessage = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { auth_token, message_id } = request.body as { 
            auth_token: string;
            message_id: number;
        };

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

        if (targetMessage.is_deleted) {
            return reply.status(406).send({ status: "ALREADY_DELETED" });
        }

        await prisma.directMessage.update({
            data: {
                is_deleted: true
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


export const deleteDirectMessageSchema = {
    body: {
        type: 'object',
        required: ['auth_token', 'message_id'],
        properties: {
            auth_token: {
                type: 'string'
            },
            message_id: {
                type: 'number'
            }
        }
      }
};
