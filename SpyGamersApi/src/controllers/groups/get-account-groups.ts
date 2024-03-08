import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';
import { isStringEmptyOrWhitespace } from '../../utils/isStringEmptyOrWhitespace';

const prisma = new PrismaClient();

export const getAccountGroups = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const { auth_token, filter } = request.body as { auth_token: string; filter?: string };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        let groups;
        if (filter) {
            // Filter is provided, find groups with partial, case-insensitive matching of group name
            groups = await prisma.group.findMany({
                where: {
                    members: {
                        some: {
                            account_id: account.id
                        }
                    },
                    name: {
                        contains: filter,
                        mode: 'insensitive'
                    }
                },
                select: {
                    id: true,
                    name: true,
                    description: true
                }
            });
        } else {
            // No filter is provided, find all groups that the account is a part of
            groups = await prisma.group.findMany({
                where: {
                    members: {
                        some: {
                            account_id: account.id
                        }
                    }
                },
                select: {
                    id: true,
                    name: true,
                    description: true
                }
            });
        }

        const data = groups.map(group => ({
            group_id: group.id,
            group_name: group.name,
            group_description: group.description
        }));

        reply.status(200).send({ status: "SUCCESS", result: data });
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    }
};
export const getAccountGroupsSchema = {
    type: 'object',
    required: ['auth_token'],
    properties: {
        auth_token: { type: 'string' },
        filter: { type: 'string' }
    },
};