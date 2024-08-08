const multer = require('multer'); // Import multer for handling file uploads
const path = require('path'); // Import path module for handling file paths
const fs = require('fs'); // Import file system module
const { promisify } = require('util'); // Import promisify function to convert callback-based functions to promise-based
const readFile = promisify(fs.readFile); // Convert fs.readFile to a promise-based function
const unlink = promisify(fs.unlink); // Convert fs.unlink to a promise-based function

// Configure disk storage for multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) { // Define the destination directory for uploaded files
        cb(null, './uploads/'); // Set the destination directory to './uploads/'
    },
    filename: function(req, file, cb) { // Define the filename for uploaded files
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname).toLowerCase(); // Generate a unique suffix using the current timestamp and a random number, and append the original file extension
        cb(null, file.fieldname + '-' + uniqueSuffix); // Set the filename to the field name with the unique suffix
    }
});

// Create multer instance with disk storage and file size restrictions
const upload = multer({
    storage: storage, // Use the configured disk storage
    limits: {
        fileSize: 100 * 1024 * 1024, // Set maximum file size to 100 MB in bytes
    },
});

// Export the multer instance for use in other parts of the application
module.exports = upload;
