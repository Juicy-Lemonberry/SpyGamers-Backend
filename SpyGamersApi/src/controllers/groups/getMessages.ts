import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';


export const getGroupMessages = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, group_id, chunk_size = 25, start_id } = request.body as { auth_token: string; group_id: number; chunk_size?: number; start_id?: number };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(200).send({ status: "BAD_AUTH" });
        }

        // Check if group exists
        const groupExists = await prisma.group.findFirst({
            where: {
                id: group_id
            }
        });

        if (!groupExists){
            return reply.status(200).send({ status: "GROUP_NOT_EXISTS" });
        }

        // Check if the account is a member of the specified group
        const isMember = await prisma.groupMember.findFirst({
            where: {
                account_id: account.id,
                group_id: group_id
            }
        });

        if (!isMember) {
            return reply.status(200).send({ status: "NOT_GROUP_MEMBER" });
        }

        // Find the latest messages of the group
        let messages;
        if (start_id) {
            // If start_id is provided, fetch messages starting from the specified message ID
            messages = await prisma.groupMessage.findMany({
                where: {
                    group_id: group_id,
                    id: {
                        lt: start_id // Fetch messages with ID less than start_id
                    }
                },
                orderBy: {
                    timestamp: 'desc' // Order by timestamp in descending order (latest first)
                },
                take: chunk_size // Limit the number of messages retrieved to chunk_size
            });
        } else {
            // If start_id is not provided, fetch the latest messages of the group
            messages = await prisma.groupMessage.findMany({
                where: {
                    group_id: group_id
                },
                orderBy: {
                    timestamp: 'desc' // Order by timestamp in descending order (latest first)
                },
                take: chunk_size // Limit the number of messages retrieved to chunk_size
            });
        }

        // Format the response data
        const data = messages.map(message => ({
            id: message.id,
            sender_id: message.sender_id,
            content: message.is_deleted ? "This message was deleted..." : message.content,
            timestamp: message.timestamp,
            is_deleted: message.is_deleted
        }));

        reply.status(200).send({ status: "SUCCESS", result: data });
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const getGroupMessagesSchema = {
    type: 'object',
    required: ['auth_token', 'group_id'],
    properties: {
        auth_token: { type: 'string' },
        group_id: { type: 'number' },
        chunk_size: { type: 'number' },
        start_id: { type: 'number' }
    },
};