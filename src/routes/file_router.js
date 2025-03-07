const { Router } = require('express');
const fileController = require('../controllers/file_controller');
const upload = require('../utils/multer-config');
const express = require('express');

const router = Router();

router.get('/', fileController.getAllItems);

router.post('/create-folder', (req, res, next) => {
    console.log('Create folder request body:', req.body);
    next();
}, fileController.makeDirectory);

router.post('/delete-folder/:id', fileController.deleteDirectory);
router.get('/update-folder/:id', fileController.getUpdateForm);
router.post('/update-folder/:id', fileController.updateDirectory);

router.post('/upload-file', express.urlencoded({ extended: true }), upload.single('file'), (req, res, next) => {
    console.log('Upload file request:', { 
        file: req.file,
        body: req.body
    });
    
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    next();
}, fileController.addFile);

router.post('/select-directory', (req, res, next) => {
    console.log('Select directory request body:', req.body);
    next();
}, fileController.selectDirectory);

router.post('/delete-file/:id', fileController.deleteFile);

// Add these routes for updating file and directory names
router.post('/update-file/:id', fileController.updateFileName);
router.post('/update-directory/:id', fileController.updateDirectoryName);
router.get('/download-file/:id', fileController.downloadFile);

module.exports = router;