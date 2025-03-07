const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!req.user || !req.user.id) {
            console.error('User not authenticated or user ID missing');
            return cb(new Error('User not authenticated or user ID missing'));
        }

        // Construct the full path for user uploads
        const userPath = path.join(__dirname, '../../user_files', req.user.id.toString());
        
        console.log('Attempting to save file to:', userPath);
        
        // Ensure the directory exists
        fs.mkdir(userPath, { recursive: true }, (err) => {
            if (err) {
                console.error('Failed to create directory:', err);
                return cb(err);
            }
            
            console.log('Directory verified/created at:', userPath);
            cb(null, userPath);
        });
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const filename = `${timestamp}-${file.originalname}`;
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    if (!req.user) {
        console.error('File upload attempted without user authentication');
        return cb(new Error('User not authenticated'), false);
    }
    
    console.log('File upload authorized for user:', req.user.id);
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload;