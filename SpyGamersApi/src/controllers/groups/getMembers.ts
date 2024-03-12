import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

const prisma = new PrismaClient();

export const getGroupMembers = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { auth_token, group_id } = request.body as { auth_token: string; group_id: number; };

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

        // Check if the account is a member of the specified group
        const isMember = await prisma.groupMember.findFirst({
            where: {
                account_id: account.id,
                group_id: group_id
            }
        });

        if (!isMember) {
            return reply.status(406).send({ status: "NOT_GROUP_MEMBER" });
        } 

        // Fetch all accounts that are members of the specified group
        const groupMembers = await prisma.groupMember.findMany({
            where: {
                group_id: group_id
            },
            include: {
                account: {
                    select: {
                        id: true,
                        username: true,
                        created_at: true
                    }
                }
            }
        });

        // Format the response data
        const data = groupMembers.map(member => ({
            id: member.account.id,
            username: member.account.username,
            is_admin: member.is_admin,
            account_creation_date: member.account.created_at
        }));

        reply.status(200).send({ status: "SUCCESS", result: data });
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    }
};


export const getGroupMembersSchema = {
    type: 'object',
    required: ['auth_token', 'group_id'],
    properties: {
        auth_token: { type: 'string' },
        group_id: { type: 'number' }
    },
};