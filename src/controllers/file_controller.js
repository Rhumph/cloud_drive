const fs = require('fs');
const path = require('path');

async function makeDirectory(req, res) {
    try {
        const userId = req.user.id; 
        const dirName = req.body.dirName;
        const userFolderPath = path.join(__dirname, '../../user_files', userId.toString(), dirName);

        console.log('req.user:', req.user);

        if (!req.user) {
            return res.status(401).send('User not authenticated');
        }

        if (!fs.existsSync(userFolderPath)) {
            fs.mkdirSync(userFolderPath, { recursive: true });
            console.log(`Directory ${dirName} created for user ${userId}`);
        } else {
            console.log(`Directory ${dirName} already exists for user ${userId}`);
        }

        const userDir = path.join(__dirname, '../../user_files', userId.toString());
        const files = fs.readdirSync(userDir);
        res.render('home-page', { files: files });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

async function getAllFiles(req, res) {
    try {
        const userId = req.user.id;
        const userDir = path.join(__dirname, '../../user_files', userId.toString());
        const files = fs.readdirSync(userDir);
        res.render('home-page', { files: files });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

async function addFile(req, res) {
    try {
        const userId = req.user.id;
        const userDir = path.join(__dirname, '../../user_files', userId.toString());
        const file = req.files.file;
        const fileName = file.name;
        const filePath = path.join(userDir, fileName);
        file.mv(filePath, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect('/');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    makeDirectory,
    getAllFiles,
    addFile
};