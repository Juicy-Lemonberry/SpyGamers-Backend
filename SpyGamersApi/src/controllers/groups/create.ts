import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';
import { isStringEmptyOrWhitespace } from '../../utils/isStringEmptyOrWhitespace';

export const createGroup = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    
    try {
        const { auth_token, group_name, group_description } = request.body as { auth_token: string; group_name: string; group_description?: string };

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (account == undefined) {
            reply.status(200).send({ status: "BAD_AUTH" });
        }

        if (isStringEmptyOrWhitespace(group_name)) {
            reply.status(200).send({ status: "EMPTY_GROUP_NAME" });
        }

        if (group_name.length > 128) {
            reply.status(200).send({ status: "NAME_TOO_LONG" });
        }

        // Create the new group
        const newGroup = await prisma.group.create({
            data: {
                name: group_name,
                description: group_description
            }
        });

        // Add as admin...
        await prisma.groupMember.create({
            data: {
                account_id: account!.id,
                group_id: newGroup.id,
                is_admin: true
            }
        })

        reply.status(201).send({ status: "SUCCESS", group_id: newGroup.id });
    } catch (error) {
        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};

export const createGroupSchema = {
    type: 'object',
    required: ['auth_token', 'group_name' ],
    properties: {
        auth_token: { type: 'string' },
        group_name: { type: 'string' },
        group_description: { type: 'string' },
    },
};