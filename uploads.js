const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

// Configure disk storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname).toLowerCase();
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

const fileFilter = (req, file, cb) => {
    const validMimeTypes = ['image/jpeg', 'image/png'];
    if (validMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG/PNG images allowed.'));
    }
};

// Create multer instance with disk storage and file type restrictions
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // Maximum file size in bytes
    },
});

module.exports = upload;
