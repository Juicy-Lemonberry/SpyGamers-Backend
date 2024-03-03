import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma, DirectMessage } from '@prisma/client';

import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';
import { APPLICATION_SETTINGS } from '../../../config/settings';

const prisma = new PrismaClient();

interface SentMessage {
    message_id: number;
    sender_username: string;
    contact_username: string;
    content: string;
    timestamp: Date;
    attachments_id: number[];
}

async function _getSentMessages(accountAId: number, accountBId: number, chunkSize: number) {
    return await prisma.directMessage.findMany({
        where: {
            OR: [
                { sender_id: accountAId, contact_id: accountBId },
                { sender_id: accountBId, contact_id: accountAId }
            ]
        },
        orderBy: { timestamp: 'desc' },
        take: chunkSize,
        include: {
            sender: true,
            contact: true,
            attachments: true,
        },
    });
}

async function _getSentMessagesBeforeMessageId(accountAId: number, accountBId: number, startMessageId: number, chunkSize: number) {
    return await prisma.directMessage.findMany({
        where: {
            OR: [
                { sender_id: accountAId, contact_id: accountBId },
                { sender_id: accountBId, contact_id: accountAId }
            ],
            id: {
                lt: startMessageId // Fetch messages with IDs less than the start message ID
            }
        },
        orderBy: { timestamp: 'desc' },
        take: chunkSize,
        include: {
            sender: true,
            contact: true,
            attachments: true,
        },
    });
}

export const getDirectMessages = async (request: FastifyRequest, reply: FastifyReply) => {
    let { auth_token, target_username, chunk_size, start_id } = request.body as {
        auth_token: string;
        target_username: string;
        chunk_size?: number;
        start_id?: number;
    };

    try {
        console.log(auth_token)
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        console.log(auth_token)
        if (!account) {
            return reply.status(401).send({ status: "FAILURE" });
        }

        const targetAccount = await prisma.account.findFirst({
            where: {
                username: target_username
            }
        });

        if (targetAccount == null) {
            return reply.status(406).send({ status: "TARGET_NOT_FOUND" });
        }

        if (!chunk_size) {
            chunk_size = APPLICATION_SETTINGS.DEFAULT_MESSAGE_CHUNK_SIZE;
        }

        const sentDirectMessages = await (start_id ?
            _getSentMessagesBeforeMessageId(account.id, targetAccount.id, start_id, chunk_size) : _getSentMessages(account.id, targetAccount.id, chunk_size)
        )

        const formattedSentMessages: SentMessage[] = sentDirectMessages.map((message) => ({
            message_id: message.id,
            sender_username: message.sender.username,
            contact_username: message.contact.username,
            content: message.content,
            timestamp: message.timestamp,
            attachments_id: message.attachments.map((attachment) => attachment.id),
        }));

        reply.status(201).send({
            status: "SUCCESS",
            messages: formattedSentMessages
        })
        
    } catch (error) {
        console.log(error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return reply.status(404).send({ status: "USER_NOT_FOUND" });
        }

        reply.status(500).send({ status: "FAILURE" });
    }
};

export const getDirectMessagesSchema = {
    type: 'object',
    required: ['auth_token', 'target_username'],
    properties: {
        auth_token: { type: 'string' },
        target_username: { type: 'string' },
        chunk_size: { type: 'number' },
        start_id: { type: 'number' }
    },
};