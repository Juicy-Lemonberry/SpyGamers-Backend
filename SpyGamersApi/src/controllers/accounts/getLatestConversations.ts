import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

const prisma = new PrismaClient();

interface Conversation {
    conversation_id: number;
    name: string;
    latest_content: string;
    activity_date: Date;
    conversation_type: "GROUP" | "DIRECT_MESSAGE";
}

interface GroupConversation {
    id: number;
    content: string;
    timestamp: Date;
    group: { name: string };
}

interface DirectMessageConversation {
    id: number;
    content: string;
    timestamp: Date;
    sender: { username: string };
    contact: { username: string };
}

// Type guard for group conversation
function isGroupConversation(conversation: any): conversation is GroupConversation {
    return conversation.group !== undefined;
}

export const getLatestConversation = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const { auth_token, chunk_size } = request.body as { auth_token: string; chunk_size?: number; };

        // Find the account associated with the provided auth token
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            reply.status(401).send({ status: "BAD_AUTH" });
            return;
        }

        // Fetch the top 20 latest group conversations
        const groupConversations = await prisma.groupMessage.findMany({
            where: {
                group: {
                    members: { some: { account_id: account.id } }
                },
                is_deleted: false
            },
            orderBy: { timestamp: 'desc' },
            take: chunk_size ? chunk_size : 20,
            select: {
                id: true,
                content: true,
                timestamp: true,
                group: { select: { name: true } }
            }
        });

        // Fetch the top 20 latest direct message conversations
        const directMessageConversations = await prisma.directMessage.findMany({
            where: {
                OR: [{ sender_id: account.id }, { contact_id: account.id }],
                is_deleted: false
            },
            orderBy: { timestamp: 'desc' },
            take: chunk_size ? chunk_size : 20,
            select: {
                id: true,
                content: true,
                timestamp: true,
                sender: { select: { username: true } },
                contact: { select: { username: true } }
            }
        });

        // Combine and sort both types of conversations
        const conversations: Conversation[] = [...groupConversations, ...directMessageConversations]
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, chunk_size ? chunk_size : 20)
            .map(conversation => ({
                conversation_id: conversation.id,
                // Either groups' name, or the other person's username in a direct message.
                name: isGroupConversation(conversation) ? conversation.group.name : (conversation.sender.username === account.username ? conversation.contact.username : conversation.sender.username) || '',
                latest_content: conversation.content,
                activity_date: conversation.timestamp,
                conversation_type: isGroupConversation(conversation) ? "GROUP" : "DIRECT_MESSAGE"
            }));

        reply.status(200).send({ status: "SUCCESS", result: conversations });
    } catch (error) {
        reply.status(500).send({ status: "FAILURE" });
    }
};

export const getLatestConversationSchema = {
    type: 'object',
    required: ['auth_token'],
    properties: {
        auth_token: { type: 'string' },
        chunk_size: { type: 'number' }
    },
};
