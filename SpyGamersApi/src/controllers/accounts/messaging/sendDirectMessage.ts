import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../../utils/tryFindAccountBySessionToken';

import * as fs from 'fs';
import * as path from 'path';
import { tryGetFileImageExtension } from '../../../utils/tryGetFileImageExtension';
import { DIRECT_MESSAGE_IMAGE_DIRECTORY } from '../../../const'
import { searchFriendship } from '../../../utils/searchFriendship';
import { isStringEmptyOrWhitespace } from '../../../utils/isStringEmptyOrWhitespace';
import { deleteFilesWithName } from '../../../utils/deleteFilesWithName';
import BotReplyDM from '../../../service/botReplyDM';

async function _storeAttachment(attachmentID: number, attachment: object) {
    const pictureAsEncoded = attachment as unknown as string;
    const pictureExtension = tryGetFileImageExtension(pictureAsEncoded);
    if (pictureExtension == undefined) {
        return false;
    }

    const targetFilePath = path.join(DIRECT_MESSAGE_IMAGE_DIRECTORY, `dma_${attachmentID}.` + pictureExtension);

    // Define the target file path
    const buffer = Buffer.from(pictureAsEncoded, 'base64');
    await fs.promises.writeFile(targetFilePath, buffer);
    return true;
}

async function _saveAttachment(prisma: PrismaClient, directMessageID: number, attachment: object) {
    const newAttachmentStore = await prisma.directMessageAttachment.create({
        data: {
            dm_id: directMessageID
        }
    });

    return {
        status: await _storeAttachment(newAttachmentStore.id, attachment),
        attachmentID: newAttachmentStore.id
    }
}

async function _tryStoreAttachments(prisma: PrismaClient, directMessageID: number, attachments: object[]) {
    await fs.promises.mkdir(DIRECT_MESSAGE_IMAGE_DIRECTORY, { recursive: true });

    const attachmentPromises = attachments.map(async (attachment) => await _saveAttachment(prisma, directMessageID, attachment));

    return await Promise.all(attachmentPromises);
}

export const sendDirectMessage = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, target_account_id, content, attachments } = request.body as { 
            auth_token: string;
            target_account_id: string;
            content: string;
            attachments?: object | object[];
        };

        let directMessageID = -1;
    
        if (isStringEmptyOrWhitespace(content)){
            return reply.status(406).send({ status: "EMPTY_CONTENT" });
        }

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(401).send({ status: "BAD_AUTH" });
        }

        const targetAccount = await prisma.account.findFirst({
            where: {
                id: parseInt(target_account_id)
            }
        });

        if (targetAccount == null) {
            return reply.status(406).send({ status: "TARGET_NOT_FOUND" });
        }

        // Check if target and self are friends...s
        const currentFriendship = await searchFriendship(prisma, account.id, targetAccount.id);
        if (currentFriendship == undefined || !currentFriendship.request_accepted) {
            return reply.status(406).send({ status: "TARGET_NOT_FRIENDS" });
        }

        // Create new direct message
        const newDirectmessage = await prisma.directMessage.create({
            data: {
                sender_id: account.id,
                contact_id: targetAccount.id,
                content: content
            }
        });

        directMessageID = newDirectmessage.id;
        if (!attachments) {
            if (targetAccount.is_bot) {
                BotReplyDM(targetAccount.id, account.id, content)
                .then((result) => {})
                .catch((error) => console.error("Unhandled Error when replying to bot's DM :: ", error))
            }

            // No attachments included, end.
            return reply.status(201).send({ status: "SUCCESS" });
        }

        // Convert single attachment to array
        const attachmentArray = Array.isArray(attachments) ? attachments : [attachments];
        // There are attachments to store...
        const storeResults = await _tryStoreAttachments(prisma, directMessageID, attachmentArray);

        // Check if storing the attachments failed
        let storeSuccess = true;
        for (const storeResult of storeResults) {
            if (!storeResult.status) {
                storeSuccess = false;
                break;
            }
        }

        if (storeSuccess) {
            if (targetAccount.is_bot) {
                BotReplyDM(targetAccount.id, account.id, content)
                .then((result) => {})
                .catch((error) => console.error("Unhandled Error when replying to bot's DM :: ", error))
            }

            return reply.status(201).send({ status: "SUCCESS" });
        }

        // Store failed, revert and undo all actions that stored the message/images
        await prisma.directMessageAttachment.deleteMany({
            where: {
                dm_id: directMessageID
            }
        })

        const removeAttachmensPromises = storeResults.map(async (storeResult) => {
            await deleteFilesWithName(DIRECT_MESSAGE_IMAGE_DIRECTORY, `dma_${storeResult.attachmentID}`)
        });
    
        await Promise.all(removeAttachmensPromises);

        await prisma.directMessage.delete({
            where: {
                id: directMessageID
            }
        })

        return reply.status(406).send({ status: "BAD_IMAGE" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const sendDirectMessageSchema = {
    body: {
        type: 'object',
        required: ['auth_token', 'target_account_id', 'content'],
        properties: {
        attachments: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    filename: { type: 'string' },
                    data: { type: 'string' } // assume data is base64 encoded...
                },
                required: ['filename', 'data']
            }
        },
        auth_token: {
            type: 'string'
        },
        target_account_id: {
            type: 'number'
        },
        content: {
            type: 'string'
        }
    }
      }
};
