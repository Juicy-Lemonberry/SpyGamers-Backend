import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

import * as fs from 'fs';
import * as path from 'path';
import { tryGetFileImageExtension } from '../../utils/tryGetFileImageExtension';
import { ACCOUNT_IMAGE_DIRECTORY } from '../../const'
import { deleteFilesWithName } from '../../utils/deleteFilesWithName';

const prisma = new PrismaClient();

export const changeProfilePicture = async (request: FastifyRequest, reply: FastifyReply) => {
    const { auth_token, profile_picture } = request.body as { auth_token: string; profile_picture: object; };
    try {
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "FAILURE" });
        }

        const pictureAsEncoded = profile_picture as unknown as string;
        const pictureExtension = tryGetFileImageExtension(pictureAsEncoded);
        if (pictureExtension == undefined) {
            return reply.status(400).send({ status: "INVALID_FILE" });
        }

        // Define the target directory path
        const userFolder = path.join(ACCOUNT_IMAGE_DIRECTORY, `a${account.id}`);
        await fs.promises.mkdir(userFolder, { recursive: true });

        // Define the target file path
        const targetFilePath = path.join(userFolder, 'pfp.' + pictureExtension);
        const buffer = Buffer.from(pictureAsEncoded, 'base64');
        // Delete any existing pfp files first, before writing to it:
        await deleteFilesWithName(userFolder, "pfp");
        await fs.promises.writeFile(targetFilePath, buffer);


        return reply.status(201).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    }
};


export const changeProfilePictureSchema = {
    body: {
        type: 'object',
        required: ['auth_token', 'profile_picture'],
        properties: {
          profile_picture: {
            type: 'object',
          },
          auth_token: {
            type: 'string'
          }
        }
      }
};
