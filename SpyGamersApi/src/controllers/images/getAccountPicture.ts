import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import { ACCOUNT_IMAGE_DIRECTORY } from '../../const';
import fsPromise from 'fs/promises';
import * as fs from 'fs';
import { tryGetFileImageExtension } from '../../utils/tryGetFileImageExtension';

const path = require('path');


const prisma = new PrismaClient();

async function _findFirstPfpFilePath(folderDirectory: string): Promise<string | undefined> {
    try {
        // Check if the folder exists
        const folderExists = await fsPromise.stat(folderDirectory).then(stat => stat.isDirectory()).catch(() => false);
        if (!folderExists) {
            console.log(`Folder ${folderDirectory} does not exist.`);
            return undefined;
        }

        // Read all files in the folder
        const files = await fsPromise.readdir(folderDirectory);

        // Find the first file with name 'pfp'
        const pfpFile = files.find(file => file.startsWith('pfp'));
        if (pfpFile) {
            return path.join(folderDirectory, pfpFile);
        } else {
            return undefined;
        }
    } catch (error) {
        console.error(`Error finding 'pfp' file: ${error}`);
        return undefined;
    }
}


export const getAccountPicture = async (request: FastifyRequest, reply: FastifyReply) => {
    const { user_id } = request.query as { user_id: number };

    try {
        const accountFolder = path.join(ACCOUNT_IMAGE_DIRECTORY, `a${user_id}`);
        const pfpPath = await _findFirstPfpFilePath(accountFolder);

        if (pfpPath === undefined) {
            return reply.status(404).send({ status: "NOT_FOUND" });
        }

        const imageExtension = path.extname(pfpPath).substring(1);
        console.log(imageExtension);

        const stream = fs.createReadStream(pfpPath)
        return reply.type(`image/${imageExtension}`).send(stream);
    } catch (error) {
        reply.status(500).send({ status: "FAILURE" });
    }
};

export const getAccountPictureSchema = {
    type: 'object',
    properties: {
        querystring: {
            type: 'object',
            required: ['user_id'],
            properties: {
                user_id: { type: 'number' }
            }
        }
    },
};
