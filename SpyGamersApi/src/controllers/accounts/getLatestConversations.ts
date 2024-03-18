import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma, PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

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
    const prisma = new PrismaClient();

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
                group: { select: { id: true, name: true } }
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
                sender: { select: { id: true, username: true } },
                contact: { select: { id: true, username: true } }
            }
        });

        // Combine and sort both types of conversations
        const conversations = [...groupConversations, ...directMessageConversations]

        const seen: Record<string, boolean> = {};
        const filteredConversations = conversations.filter(conversation => {
            const conversationId = isGroupConversation(conversation) ? 
                conversation.group.id : 
                (conversation.sender.id === account.id ? conversation.contact.id : conversation.sender.id);
            const conversationType = isGroupConversation(conversation) ? "GROUP" : "DIRECT_MESSAGE";
        
            // Create a unique key for each combination
            const key = `${conversationId}-${conversationType}`;
            
            if (seen[key]) {
                // If we've seen this combination before, filter it out
                return false;
            } else {
                // Mark this combination as seen
                seen[key] = true;
                return true;
            }
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, chunk_size ? chunk_size : 20);
            

        const uniqueConversations: Conversation[] = filteredConversations.map(conversation => ({
            conversation_id: isGroupConversation(conversation) ? conversation.group.id : (conversation.sender.id === account.id ? conversation.contact.id : conversation.sender.id),
            name: isGroupConversation(conversation) ? conversation.group.name : (conversation.sender.id === account.id ? conversation.contact.username : conversation.sender.username),
            latest_content: conversation.content,
            activity_date: conversation.timestamp,
            conversation_type: isGroupConversation(conversation) ? "GROUP" : "DIRECT_MESSAGE"
        }));

        reply.status(200).send({ status: "SUCCESS", result: uniqueConversations });
    } catch (error) {
        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
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
