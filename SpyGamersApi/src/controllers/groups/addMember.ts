import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';
import { searchFriendship } from '../../utils/searchFriendship';

export const addMember = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, group_id, target_user_id } = request.body as { auth_token: string; group_id: number; target_user_id: number; };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        // Check if group exists
        const groupExists = await prisma.group.findFirst({
            where: {
                id: group_id
            }
        });

        if (!groupExists){
            return reply.status(406).send({ status: "GROUP_NOT_EXISTS" });
        }

        // Check if the account is an admin member of the specified group
        const isMember = await prisma.groupMember.findFirst({
            where: {
                account_id: account.id,
                group_id: group_id
            }
        });

        if (!isMember) {
            return reply.status(406).send({ status: "NOT_GROUP_MEMBER" });
        }

        if (!isMember.is_admin) {
            return reply.status(406).send({ status: "NOT_GROUP_ADMIN" });
        }

        // Check if target is already a member:
        const targetIsMember = await prisma.groupMember.findFirst({
            where: {
                account_id: target_user_id,
                group_id: group_id
            }
        });

        if (targetIsMember) {
            return reply.status(406).send({ status: "EXISTING_MEMBER"})
        }

        // Check if target and user is friends
        const friendship = await searchFriendship(prisma, account.id, target_user_id);
        if (friendship == undefined || !friendship.request_accepted) {
            return reply.status(406).send({ status: "NOT_FRIENDS" })
        }

        // Add into group...
        await prisma.groupMember.create({
            data: {
                account_id: target_user_id,
                group_id: group_id,
                is_admin: false
            }
        })

        reply.status(200).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const addMemberSchema = {
    type: 'object',
    required: ['auth_token', 'group_id', 'target_user_id'],
    properties: {
        auth_token: { type: 'string' },
        group_id: { type: 'number' },
        target_user_id: { type: 'number' }
    },
};