const multer = require('multer');
const path = require('path');

// Configure disk storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

// Create multer instance with disk storage and file type restrictions
const upload = multer({
    storage: storage,
    limits: {
      fileSize: 100 * 1024 * 1024, // Maximum file size in bytes
    },
    fileFilter: function(req, file, cb) {
        // Allowed extensions
        const fileTypes = /jpeg|jpg|png/;
        // Check ext
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        // Check mime
        const mimeType = fileTypes.test(file.mimetype);

        if (extName && mimeType) {
            cb(null, true);
        } else {
            cb(new Error('Upload only.jpeg or.png format is allowed'));
        }
    }
});

module.exports = upload;