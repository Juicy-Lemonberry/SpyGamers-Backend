import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

import * as fs from 'fs';
import * as path from 'path';
import { tryGetFileImageExtension } from '../../utils/tryGetFileImageExtension';
import { isStringEmptyOrWhitespace } from '../../utils/isStringEmptyOrWhitespace';
import { deleteFilesWithName } from '../../utils/deleteFilesWithName';
import { GROUP_IMAGE_DIRECTORY } from '../../const';
import BotReplyGroup from '../../service/botReplyGroup';

async function _storeAttachment(attachmentID: number, attachment: object) {
    const pictureAsEncoded = attachment as unknown as string;
    const pictureExtension = tryGetFileImageExtension(pictureAsEncoded);
    if (pictureExtension == undefined) {
        return false;
    }

    const targetFilePath = path.join(GROUP_IMAGE_DIRECTORY, `ga_${attachmentID}.` + pictureExtension);

    // Define the target file path
    const buffer = Buffer.from(pictureAsEncoded, 'base64');
    await fs.promises.writeFile(targetFilePath, buffer);
    return true;
}

async function _tryStoreAttachments(prismaConnection: PrismaClient, groupMessageID: number, attachments: object[]) {
    await fs.promises.mkdir(GROUP_IMAGE_DIRECTORY, { recursive: true });

    const attachmentPromises = attachments.map(async (attachment) => {
        const newAttachmentStore = await prismaConnection.groupMessageAttachment.create({
            data: {
                message_id: groupMessageID
            }
        });

        return {
            status: await _storeAttachment(newAttachmentStore.id, attachment),
            attachmentID: newAttachmentStore.id
        }
    });

    return await Promise.all(attachmentPromises);
}

async function _getRandomBotToReply(prismaConnection: PrismaClient, groupID: number, message: string) {
    const accounts = await prismaConnection.account.findMany({
        where: {
            is_bot: true,
            group_members: {
                some: {
                    group_id: groupID
                }
            }
        },
        select: {
            id: true
        }
    });

    // No bot in group...
    if (accounts.length === 0) {
        return;
    }

    // Pick a random bot in group, and let it reply...
    const randomIndex = Math.floor(Math.random() * accounts.length);
    const randomAccount = accounts[randomIndex];

    BotReplyGroup(randomAccount.id, groupID, message);
}

export const sendGroupMessage = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();

    try {
        const { auth_token, group_id, content, attachments } = request.body as { 
            auth_token: string;
            group_id: string;
            content: string;
            attachments?: object | object[];
        };

        const group_id_int = parseInt(group_id);
        let groupMessageID = -1;
    
        if (isStringEmptyOrWhitespace(content)){
            return reply.status(200).send({ status: "EMPTY_CONTENT" });
        }

        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (!account) {
            return reply.status(200).send({ status: "BAD_AUTH" });
        }

        // Check if group exists
        const groupExists = await prisma.group.findFirst({
            where: {
                id: group_id_int
            }
        });

        if (!groupExists){
            return reply.status(200).send({ status: "GROUP_NOT_EXISTS" });
        }

        // Check if the sender is a member of the specified group
        const isMember = await prisma.groupMember.findFirst({
            where: {
                account_id: account.id,
                group_id: group_id_int
            }
        });

        if (!isMember) {
            return reply.status(200).send({ status: "NOT_GROUP_MEMBER" });
        }

        // Create new direct message for the group
        const newGroupMessage = await prisma.groupMessage.create({
            data: {
                sender_id: account.id,
                group_id: group_id_int,
                content: content
            }
        });

        groupMessageID = newGroupMessage.id;
        if (!attachments) {
            // No attachments included, end.
            const result= {
                message_id: groupMessageID,
                timestamp: newGroupMessage.timestamp
            }

            _getRandomBotToReply(prisma, group_id_int, content);
            return reply.status(201).send({ status: "SUCCESS", result: result });
        }

        // Convert single attachment to array
        const attachmentArray = Array.isArray(attachments) ? attachments : [attachments];
        // There are attachments to store...
        const storeResults = await _tryStoreAttachments(prisma, groupMessageID, attachmentArray);

        // Check if storing the attachments failed
        let storeSuccess = true;
        for (const storeResult of storeResults) {
            if (!storeResult.status) {
                storeSuccess = false;
                break;
            }
        }

        if (storeSuccess) {

            const attachment_ids = storeResults.map(storeRes => ({
                id: storeRes.attachmentID
            }));

            const result= {
                message_id: groupMessageID,
                timestamp: newGroupMessage.timestamp,
                attachment_ids: attachment_ids
            }

            _getRandomBotToReply(prisma, group_id_int, content);
            return reply.status(201).send({ status: "SUCCESS", result: result });
        }

        // Store failed, revert and undo all actions that stored the message/images
        await prisma.groupMessageAttachment.deleteMany({
            where: {
                message_id: groupMessageID
            }
        })

        const removeAttachmensPromises = storeResults.map(async (storeResult) => {
            await deleteFilesWithName(GROUP_IMAGE_DIRECTORY, `ga_${storeResult.attachmentID}`)
        });
    
        await Promise.all(removeAttachmensPromises);

        await prisma.groupMessage.delete({
            where: {
                id: groupMessageID
            }
        })

        return reply.status(200).send({ status: "BAD_IMAGE" });
    } catch (error) {
        console.error("Error:", error);
        return reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};


export const sendGroupMessageSchema = {
    body: {
        type: 'object',
        required: ['auth_token', 'group_id', 'content'],
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
            group_id: {
                type: 'number'
            },
            content: {
                type: 'string'
            }
        }
    }
};
