import { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import { DIRECT_MESSAGE_IMAGE_DIRECTORY, GROUP_IMAGE_DIRECTORY } from '../../const';
import fsPromise from 'fs/promises';
import * as fs from 'fs';
import { tryFindAccountBySessionToken } from '../../utils/tryFindAccountBySessionToken';

const path = require('path');

async function _findFirstFilePath(folderDirectory: string, uniqueAttachmentName: string): Promise<string | undefined> {
    try {
        // Check if the folder exists
        const folderExists = await fsPromise.stat(folderDirectory).then(stat => stat.isDirectory()).catch(() => false);
        if (!folderExists) {
            console.log(`Folder ${folderDirectory} does not exist.`);
            return undefined;
        }

        const files = await fsPromise.readdir(folderDirectory);
        const attachmentFile = files.find(file => file.startsWith(uniqueAttachmentName));
        if (attachmentFile) {
            return path.join(folderDirectory, attachmentFile);
        } else {
            return undefined;
        }
    } catch (error) {
        console.error(`Error finding '${uniqueAttachmentName}' file: ${error}`);
        return undefined;
    }
}

async function _handleGroupAttachment(prisma: PrismaClient, reply: FastifyReply, accountID: number, attachmentID: number) {
    const attachment = await prisma.groupMessageAttachment.findFirst({
        where: {
            id: attachmentID
        }
    });

    if (attachment == null) {
        return reply.status(200).send({ status: "ATTACHMENT_NOT_EXISTS" });
    }

    const groupMessage = await prisma.groupMessage.findFirst({
        where: {
            id: attachment.message_id
        }
    })

    if (groupMessage == null) {
        return reply.status(200).send({ status: "ATTACHMENT_NOT_EXISTS" });
    }

    const accountGroupMember = await prisma.groupMember.findFirst({
        where: {
            group_id: groupMessage.group_id,
            account_id: accountID
        }
    })

    if (accountGroupMember == null) {
        return reply.status(200).send({ status: "NOT_IN_GROUP" });
    }
 

    const filePath = await _findFirstFilePath(GROUP_IMAGE_DIRECTORY, `ga_${attachmentID}`);
    if (filePath == undefined) {
        return reply.status(200).send({ status: "ATTACHMENT_NOT_EXISTS" });
    }

    const imageExtension = path.extname(filePath).substring(1);
    console.log(imageExtension);

    const stream = fs.createReadStream(filePath)
    return reply.type(`image/${imageExtension}`).send(stream);
}


async function _handleDirectMessageAttachment(prisma: PrismaClient, reply: FastifyReply, accountID: number, attachmentID: number) {
    const attachment = await prisma.directMessageAttachment.findFirst({
        where: {
            id: attachmentID
        }
    });

    if (attachment == null) {
        return reply.status(200).send({ status: "ATTACHMENT_NOT_EXISTS" });
    }

    const directMessage = await prisma.directMessage.findFirst({
        where: {
            id: attachment.dm_id
        }
    })

    if (directMessage == null) {
        return reply.status(200).send({ status: "ATTACHMENT_NOT_EXISTS" });
    }

    const canViewAttachment = directMessage.contact_id == accountID || directMessage.sender_id == accountID
    if (!canViewAttachment) {
        return reply.status(200).send({ status: "NOT_IN_DM" });
    }

    const filePath = await _findFirstFilePath(DIRECT_MESSAGE_IMAGE_DIRECTORY, `dma_${attachmentID}`);
    if (filePath == undefined) {
        return reply.status(200).send({ status: "ATTACHMENT_NOT_EXISTS" });
    }

    const imageExtension = path.extname(filePath).substring(1);
    console.log(imageExtension);

    const stream = fs.createReadStream(filePath)
    return reply.type(`image/${imageExtension}`).send(stream);
}

export const getAttachment = async (request: FastifyRequest, reply: FastifyReply) => {
    const prisma = new PrismaClient();
    try {
        const { attachment_id, auth_token, attachment_type = "DIRECT_MESSAGE" } = request.body as { attachment_id: number; auth_token:string; attachment_type?: string; }
        const account = await tryFindAccountBySessionToken(auth_token, prisma);
        if (account == undefined) {
            return reply.status(200).send({ status: `BAD_AUTH` });
        }

        if (attachment_type.trim().toUpperCase() == "GROUP") {
            return await _handleGroupAttachment(prisma, reply, account.id, attachment_id);
        } else if (attachment_type.trim().toUpperCase() == "DIRECT_MESSAGE") {
            return await _handleDirectMessageAttachment(prisma, reply, account.id, attachment_id);
        }

        return reply.status(200).send({ status: `UNKNOWN_ATTACHMENT_TYPE` });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return reply.status(200).send({ status: `ID_INVALID` });
        }

        reply.status(500).send({ status: "FAILURE" });
    } finally {
        await prisma.$disconnect();
    }
};

export const getAttachmentSchema = {
    type: 'object',
    required: ['attachment_id', 'auth_token'],
    properties: {
        attachment_id: { type: 'number' },
        auth_token: { type: 'string' },
        attachment_type: {type: 'string'}
    },
};
