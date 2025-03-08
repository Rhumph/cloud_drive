const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prisma_client');
const multer = require('multer');
// const { type } = require('os');
const { use } = require('../routes/file_router');


async function makeDirectory(req, res) {
    try {
        const userId = req.user.id;
        const dirName = req.body.dirName;
        const targetDirectoryPath = req.body.targetDirectoryPath || ''; // Get the target directory path from the request body, default to root if not provided
        console.log('Make directory targetDirectoryPath:', targetDirectoryPath);
        const userRootPath = path.join(__dirname, '../../user_files', userId.toString());
        const userFolderPath = path.join(targetDirectoryPath, dirName);

        if (!req.user) {
            return res.status(401).send('User not authenticated');
        }

        if (!fs.existsSync(userFolderPath)) {
            fs.mkdirSync(userFolderPath, { recursive: true });
            const newDir = await prisma.directory.create({
                data: {
                    name: dirName,
                    userId: userId, 
                    type: 'folder',
                    path: userFolderPath,
                    size: 0
                }
            });
            console.log(`Directory ${dirName} created for user ${userId}`);
        } else {
            console.log(`Directory ${dirName} already exists for user ${userId}`);
        }
        getAllItems(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

async function deleteDirectory(req, res) {
    const userId = req.user.id;
    const dirID = req.params.id;
    const targetDir = await prisma.directory.findUnique({
        where: {
            id: parseInt(dirID)
        }
    });
    const targetDirPath = targetDir.path;
    const deleteDir = await prisma.directory.delete({
        where: {
            id: parseInt(dirID)
        }
    });
    fs.rmdirSync(targetDirPath, { recursive: true });
    getAllItems(req, res);
}

async function getUpdateForm(req, res) {
    if (!req.user) {
        return res.status(401).send('User not authenticated');
    }
    const userId = req.user.id;
    const dirID = req.params.id;
    const targetDir = await prisma.directory.findUnique({
        where: {
            id: parseInt(dirID)
        }
    });
    res.render('update-directory', { id: userId, targetDir: targetDir });
}

async function updateDirectory(req, res) {
    const userId = req.user.id;
    const dirID = req.params.id;
    const targetDir = await prisma.directory.findUnique({
        where: {
            id: parseInt(dirID)
        }
    });
    const targetDirPath = targetDir.path;
    const newName = req.body.newName;
    const newPath = path.join(__dirname, '../../user_files', userId.toString(), newName);
    const updateDir = await prisma.directory.update({
        where: {
            id: parseInt(dirID)
        },
        data: {
            name: newName,
            // path: newPath,

        }
    });
    getAllItems(req, res);
}

async function getAllItems(req, res) {
    try {
        const userId = req.user.id;
        const userDir = path.join(__dirname, '../../user_files', userId.toString());
        const targetDirectoryPath = req.body.selectedDirectoryPath || userDir;
        console.log(targetDirectoryPath);
        console.log('Request body:', req.body);

        // Calculate the depth of the target directory path
        const targetDepth = targetDirectoryPath.split(path.sep).length;

        // Get directories from the database, excluding the current directory itself
        const rawDirectories = await prisma.directory.findMany({
            where: {
                userId: userId,
                path: {
                    startsWith: targetDirectoryPath,
                    not: { equals: targetDirectoryPath }
                }
            }
        });

        // Filter directories to ensure they are exactly one level deeper
        const directories = rawDirectories.filter(dir => dir.path.split(path.sep).length === targetDepth + 1);

        const rawFiles = await prisma.file.findMany({
            where: {
                userId: userId,
                path: {
                    startsWith: targetDirectoryPath,
                    not: { equals: targetDirectoryPath }
                }
            }
        });

        const files = rawFiles.filter(file => file.path.split(path.sep).length === targetDepth + 1);

        console.log('This here be your files', files);

        // Combine directories and files
        const items = directories.map(dir => ({
            name: dir.name,
            type: 'directory',
            size: dir.size,
            id: dir.id,
            path: dir.path
        })).concat(files.map(file => ({
            name: file.name,
            type: 'file',
            size: file.size,
            id: file.id,
            path: file.path
        })));

        res.render('home-page', { items: items, currentDirectoryPath: targetDirectoryPath });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

async function selectDirectory(req, res) {
    try {
        const userId = req.user.id;
        const selectedDirectoryPath = req.body.selectedDirectoryPath;
        const selectedDirectoryid = req.body.selectedDirectoryid;
        const userRoot = path.join(__dirname, '../../user_files', req.user.id.toString());
        console.log('Select Directory output 1', selectedDirectoryPath);
        console.log('Select Directory Request body:', req.body);

        const targetDepth = selectedDirectoryPath.split(path.sep).length;

        // Ensure the selected directory is within the user's root directory
        if (!selectedDirectoryPath.startsWith(userRoot)) {
            return res.status(400).send('Invalid directory path');
        }

        // Get the selected directory from the database
        const selectedDirectory = await prisma.directory.findUnique({
            where: {
                id: parseInt(selectedDirectoryid)
            }
        });

        if (!selectedDirectory) {
            return res.status(404).send('Directory not found');
        }

        // Get directories within the selected directory
        const rawDirectories = await prisma.directory.findMany({
            where: {
                userId: userId,
                path: {
                    startsWith: selectedDirectoryPath,
                    not: { equals: selectedDirectoryPath }
                }
            }
        });

        const directories = rawDirectories.filter(dir => dir.path.split(path.sep).length === targetDepth + 1);

        // Get files within the selected directory
        const rawFiles = await prisma.file.findMany({
            where: {
                userId: userId,
                // path: {
                //     startsWith: selectedDirectoryPath,
                //     not: { equals: selectedDirectoryPath }
                // }
            }
        });

        const files = rawFiles.filter(file => file.path.split(path.sep).length === targetDepth + 1);

        console.log('This here be your files', files);

        // Combine directories and files
        const items = directories.map(dir => ({
            name: dir.name,
            type: 'directory',
            size: dir.size,
            id: dir.id,
            path: dir.path
        })).concat(files.map(file => ({
            name: file.name,
            type: 'file',
            size: file.size,
            id: file.id,
            path: file.path
        })));

        res.render('home-page', { items: items, currentDirectoryPath: selectedDirectoryPath });
        console.log('Select Directory output 2', selectedDirectoryPath);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

async function addFile(req, res) {
    try {
        const userId = req.user.id;
        const targetDirectoryPath = req.body.targetDirectoryPath;

        if (!targetDirectoryPath) {
            return res.status(400).send('Target directory path is required');
        }

        console.log('addFile targetDirectoryPath:', targetDirectoryPath);
        console.log('addFile Request body:', req.body);
        console.log('Uploaded file:', req.file);

        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        // Ensure the directory exists
        const fullPath = path.join(targetDirectoryPath);
        fs.mkdirSync(fullPath, { recursive: true });

        // Move the file to the correct directory
        const newFilePath = path.join(fullPath, req.file.originalname);
        fs.renameSync(req.file.path, newFilePath);

        // Save file information to the database
        const newFile = await prisma.file.create({
            data: {
                name: req.file.originalname,
                userId: userId,
                path: newFilePath,
                size: req.file.size,
                type: 'file'
            }
        });

        // Fetch the directory to render
        const renderDir = await prisma.directory.findFirst({
            where: {
                path: targetDirectoryPath
            }
        });

        if (!renderDir) {
            return res.status(404).send('Directory not found');
        }

        // Call selectDirectory to reload the directory view
        req.body.selectedDirectoryPath = targetDirectoryPath;
        req.body.selectedDirectoryid = renderDir.id;
        await selectDirectory(req, res);
    } catch (err) {
        console.error('Error in addFile:', err);
        res.status(500).send('Internal Server Error');
    }
}

async function deleteFile(req, res) {
    try {
        const userId = req.user.id;
        const fileID = req.params.id;

        // Find the file in the database
        const targetFile = await prisma.file.findUnique({
            where: {
                id: parseInt(fileID)
            }
        });

        if (!targetFile) {
            return res.status(404).send('File not found');
        }

        // Ensure the file belongs to the user
        if (targetFile.userId !== userId) {
            return res.status(403).send('Unauthorized');
        }

        const targetFilePath = targetFile.path;

        // Delete the file from the filesystem
        fs.rmSync(targetFilePath);

        // Delete the file record from the database
        await prisma.file.delete({
            where: {
                id: parseInt(fileID)
            }
        });

        // Fetch the directory to render
        const targetDirectoryPath = path.dirname(targetFilePath);
        const renderDir = await prisma.directory.findFirst({
            where: {
                path: targetDirectoryPath
            }
        });

        if (!renderDir) {
            return res.status(404).send('Directory not found');
        }

        // Call selectDirectory to reload the directory view
        req.body.selectedDirectoryPath = targetDirectoryPath;
        req.body.selectedDirectoryid = renderDir.id;
        await selectDirectory(req, res);
    } catch (err) {
        console.error('Error in deleteFile:', err);
        res.status(500).send('Internal Server Error');
    }
}

async function updateFileName(req, res) {
    const userId = req.user.id;
    const fileID = req.params.id;
    const targetFile = await prisma.file.findUnique({
        where: {
            id: parseInt(fileID)
        }
    });

    const targetFilePath = targetFile.path;
    const newFileName = req.body.name;
    const newPath = path.join(__dirname, '../../user_files', userId.toString(), newFileName);
    const updateFile = await prisma.file.update({
        where: {
            id: parseInt(fileID)
        },
        data: {
            name: newFileName,
        }
    });
    getAllItems(req, res);
}

async function updateDirectoryName(req, res) {
    try {
        const userId = req.user.id;
        const directoryId = req.params.id;
        const newName = req.body.name;

        // Find the directory in the database
        const targetDirectory = await prisma.directory.findUnique({
            where: {
                id: parseInt(directoryId)
            }
        });

        if (!targetDirectory) {
            return res.status(404).send('Directory not found');
        }

        // Ensure the directory belongs to the user
        if (targetDirectory.userId !== userId) {
            return res.status(403).send('Unauthorized');
        }

        // Update the directory name in the database
        await prisma.directory.update({
            where: {
                id: parseInt(directoryId)
            },
            data: {
                name: newName
            }
        });

        res.redirect('/home');
    } catch (err) {
        console.error('Error in updateDirectoryName:', err);
        res.status(500).send('Internal Server Error');
    }
}

async function downloadFile(req, res) {
    try {
        const userId = req.user.id;
        const fileID = req.params.id;

        // Find the file in the database
        const targetFile = await prisma.file.findUnique({
            where: {
                id: parseInt(fileID)
            }
        });

        if (!targetFile) {
            return res.status(404).send('File not found');
        }

        // Ensure the file belongs to the user
        if (targetFile.userId !== userId) {
            return res.status(403).send('Unauthorized');
        }

        const targetFilePath = targetFile.path;

        // Check if the file exists on the filesystem
        if (!fs.existsSync(targetFilePath)) {
            return res.status(404).send('File not found on server');
        }

        // Send the file to the client for download
        res.download(targetFilePath, targetFile.name, (err) => {
            if (err) {
                console.error('Error in downloadFile:', err);
                res.status(500).send('Internal Server Error');
            }
        });
    } catch (err) {
        console.error('Error in downloadFile:', err);
        res.status(500).send('Internal Server Error');
    }
}

    module.exports = {
        makeDirectory,
        getAllItems,
        addFile,
        deleteDirectory,
        updateDirectory,
        getUpdateForm,
        selectDirectory,
        deleteFile,
        updateFileName,
        updateDirectoryName,
        downloadFile
    };