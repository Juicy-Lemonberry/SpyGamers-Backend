import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';
import { isStringEmptyOrWhitespace } from '../../utils/isStringEmptyOrWhitespace';

export const changeInformation = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        let { auth_token, group_id, group_name, description, public_status } = request.body as { 
            auth_token: string;
            group_id: number;
            group_name?: string;
            description?: string;
            public_status?: boolean
        };

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

        // Check if the account is an admin member of the specified group
        const isMember = await prisma.groupMember.findFirst({
            where: {
                account_id: account.id,
                group_id: group_id
            }
        });

        if (!isMember) {
            return reply.status(200).send({ status: "NOT_GROUP_MEMBER" });
        }

        if (!isMember.is_admin) {
            return reply.status(200).send({ status: "NOT_GROUP_ADMIN" });
        }

        if (!description && !group_name && !public_status)  {
            return reply.status(200).send({ status: "NOTHING_CHANGED" });
        }

        if (!description || isStringEmptyOrWhitespace(description)) {
            description = groupExists.description == null ? "" : groupExists.description;
        }

        if (!group_name || isStringEmptyOrWhitespace(group_name)) {
            group_name = groupExists.name;
        }

        await prisma.group.updateMany({
            data: {
                name: group_name,
                description: description,
                is_public: !public_status ? groupExists.is_public : public_status
            },
            where: {
                id: groupExists.id
            }
        })

        return reply.status(201).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    }
};


export const changeInformationSchema = {
    body: {
        type: 'object',
        required: ['auth_token', 'group_id'],
        properties: {
            auth_token: {
                type: 'string'
            },
            group_id: {
                type: 'number'
            },
            description: {
                type: 'string'
            },
            group_name: {
                type: 'string'
            },
            public_status: {
                type: 'boolean'
            }
        }
      }
};
