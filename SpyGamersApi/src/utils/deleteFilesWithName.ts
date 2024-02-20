const fs = require('fs').promises;
const path = require('path');

export async function deleteFilesWithName(targetFolderPath: string, fileName: string) {
    try {
        const files = await fs.readdir(targetFolderPath);

        const filesToDelete = files.filter((file: string) => file.startsWith(fileName));

        await Promise.all(filesToDelete.map(async (file: any) => {
            const filePath = path.join(targetFolderPath, file);
            await fs.unlink(filePath);
            console.log(`Deleted file: ${filePath}`);
        }));

        console.log(`All files named "${fileName}" in ${targetFolderPath} have been deleted.`);
    } catch (error) {
        console.error(`Error deleting files: ${error}`);
    }
}
