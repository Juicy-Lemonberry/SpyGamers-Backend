import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { PrismaClient, Prisma } from '@prisma/client';
import { GROUP_IMAGE_DIRECTORY } from '../../const';
import fsPromise from 'fs/promises';
import * as fs from 'fs';

const path = require('path');


const prisma = new PrismaClient();

async function _findFirstIconFilePath(folderDirectory: string, groupID: number): Promise<string | undefined> {
    try {
        // Check if the folder exists
        const folderExists = await fsPromise.stat(folderDirectory).then(stat => stat.isDirectory()).catch(() => false);
        if (!folderExists) {
            console.log(`Folder ${folderDirectory} does not exist.`);
            return undefined;
        }

        // Read all files in the folder
        const files = await fsPromise.readdir(folderDirectory);

        const pfpFile = files.find(file => file.startsWith(`g_${groupID}_icon`));
        if (pfpFile) {
            return path.join(folderDirectory, pfpFile);
        } else {
            return undefined;
        }
    } catch (error) {
        console.error(`Error finding 'icon' file: ${error}`);
        return undefined;
    }
}


export const getGroupIcon = async (request: FastifyRequest, reply: FastifyReply) => {
    const { group_id } = request.query as { group_id: string };

    try {
        const groupExists = await prisma.group.findFirst({
            where: {
                id: parseInt(group_id)
            }
        });

        if (!groupExists){
            return reply.status(406).send({ status: "GROUP_NOT_EXISTS" });
        }

        const pfpPath = await _findFirstIconFilePath(GROUP_IMAGE_DIRECTORY, groupExists.id);

        if (pfpPath === undefined) {
            return reply.status(404).send({ status: "NOT_FOUND" });
        }

        const imageExtension = path.extname(pfpPath).substring(1);
        console.log(imageExtension);

        const stream = fs.createReadStream(pfpPath)
        return reply.type(`image/${imageExtension}`).send(stream);
    } catch (error) {
        console.error(error);
        reply.status(500).send({ status: "FAILURE" });
    }
};

export const getGroupIconSchema = {
    type: 'object',
    properties: {
        querystring: {
            type: 'object',
            required: ['group_id'],
            properties: {
                group_id: { type: 'number' }
            }
        }
    },
};
