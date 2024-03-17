import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

import * as fs from 'fs';
import * as path from 'path';
import { tryGetFileImageExtension } from '../../utils/tryGetFileImageExtension';
import { GROUP_IMAGE_DIRECTORY } from '../../const'
import { deleteFilesWithName } from '../../utils/deleteFilesWithName';

export const setIcon = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    const { auth_token, icon, group_id } = request.body as { auth_token: string; icon: object; group_id: string; };
    try {
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        const group_id_int = parseInt(group_id);
        const groupExists = await prisma.group.findFirst({
            where: {
                id: group_id_int
            }
        });

        if (!groupExists){
            return reply.status(406).send({ status: "GROUP_NOT_EXISTS" });
        }

        // Check if the account is an admin member of the specified group
        const isMember = await prisma.groupMember.findFirst({
            where: {
                account_id: account.id,
                group_id: group_id_int
            }
        });

        if (!isMember) {
            return reply.status(406).send({ status: "NOT_GROUP_MEMBER" });
        }

        if (!isMember.is_admin) {
            return reply.status(406).send({ status: "NOT_GROUP_ADMIN" });
        }

        const pictureAsEncoded = icon as unknown as string;
        const pictureExtension = tryGetFileImageExtension(pictureAsEncoded);
        if (pictureExtension == undefined) {
            return reply.status(400).send({ status: "INVALID_FILE" });
        }

        // Define the target directory path
        const groupFolder = GROUP_IMAGE_DIRECTORY;
        await fs.promises.mkdir(groupFolder, { recursive: true });

        // Define the target file path
        const targetFilePath = path.join(groupFolder, `g_${groupExists.id}_icon.` + pictureExtension);
        const buffer = Buffer.from(pictureAsEncoded, 'base64');
        // Delete any existing pfp files first, before writing to it:
        await deleteFilesWithName(groupFolder, `g_${groupExists.id}_icon`);
        await fs.promises.writeFile(targetFilePath, buffer);


        return reply.status(201).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const setIconSchema = {
    body: {
        type: 'object',
        required: ['auth_token', 'icon', 'group_id'],
        properties: {
          icon: {
            type: 'object',
          },
          auth_token: {
            type: 'string'
          },
          group_id: {
            type: 'number'
          }
        }
      }
}