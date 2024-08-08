// Import required modules
require('dotenv').config(); // Load environment variables from .env file
const express = require('express'); // Import Express framework
const routes = require('./routes'); // Import custom routes module
const db = require('./database'); // Import custom database module
const app = express(); // Create an instance of Express
const fs = require('fs'); // Import file system module
const https = require('https'); // Import HTTPS module
const session = require('express-session'); // Import Express session middleware
const path = require('path'); // Import path module for handling file paths
const logger = require('./logger'); // Import custom logger module
const bodyParser = require('body-parser'); // Import body-parser middleware
const helmet = require('helmet'); // Import Helmet for securing HTTP headers
const csurf = require('csurf'); // Import CSRF protection middleware
const cookieParser = require('cookie-parser'); // Import cookie-parser middleware
const crypto = require('crypto'); // Import crypto module for generating random values

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs'); // Define the path to the logs directory
if (!fs.existsSync(logsDir)) { // Check if the logs directory does not exist
    fs.mkdirSync(logsDir); // Create the logs directory
}

// Paths to your SSL certificate and key
const privateKey = fs.readFileSync('server.key', 'utf8'); // Read SSL private key file
const certificate = fs.readFileSync('server.cert', 'utf8'); // Read SSL certificate file

// Credentials object for HTTPS server
const credentials = {
    key: privateKey, // SSL private key
    cert: certificate // SSL certificate
};

// Use Helmet to set security-related HTTP headers
app.use(helmet()); // Secure the app by setting various HTTP headers
app.use(cookieParser()); // Parse cookies

// Middleware to parse JSON bodies
app.use(express.json()); // Parse incoming JSON requests
app.use(bodyParser.json()); // Parse incoming JSON requests (redundant with express.json())
app.use(express.static('public')); // Serve static files from the 'public' directory

// Use sessions
app.use(session({
    secret: process.env.SECRET, // Secret for signing the session ID cookie
    resave: false, // Do not save session if unmodified
    saveUninitialized: true, // Save uninitialized sessions
    cookie: { 
        secure: true, // Ensure the cookie is sent only over HTTPS
        httpOnly: true, // Ensure the cookie is not accessible via JavaScript
        path: '/', // Define the path where the cookie is valid
        maxAge: 3600000, // Set cookie expiration time to 1 hour
        sameSite: 'strict' // Protect against CSRF attacks by allowing cookies to be sent only for same-site requests
    },
    genid: function(req) { // Custom session ID generator
        return crypto.randomBytes(16).toString('hex'); // Generate a 32-character long session ID
    }
}));

// Setup CSRF protection
const csrfProtection = csurf({
    cookie: {
        httpOnly: true, // Ensure the CSRF cookie is not accessible via JavaScript
        secure: true, // Ensure the CSRF cookie is sent only over HTTPS
        sameSite: 'strict' // Protect against CSRF attacks by allowing cookies to be sent only for same-site requests
    }
});
app.use(csrfProtection); // Enable CSRF protection

// Middleware to set CSRF token in the response locals
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken(); // Make CSRF token available in templates
    res.cookie('CSRF-TOKEN', res.locals.csrfToken); // Set CSRF token as a cookie
    next(); // Proceed to the next middleware
});

// Manually configure headers that require specific options
app.use((req, res, next) => {
    // X-Frame-Options: DENY - Prevents the site from being framed to avoid clickjacking attacks
    res.setHeader('X-Frame-Options', 'DENY');

    // Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
    // Forces the browser to use HTTPS for all future requests for the next 2 years
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    // X-Content-Type-Options: nosniff - Prevents the browser from interpreting files as a different MIME type to what is specified
    res.setHeader('X-Content-Type-Options', 'nosniff');

    next(); // Proceed to the next middleware
});

// Use routes
app.use('/', routes); // Mount the routes module at the root path

// Error handling middleware
app.use(function(err, req, res, next) {
    console.error(err.stack); // Log the error stack trace
    res.status(500).send('Something broke!'); // Send generic server error response
});

// Create HTTPS server
const httpsServer = https.createServer(credentials, app); // Create an HTTPS server with the SSL credentials and Express app

// Start the HTTPS server
httpsServer.listen(3000, () => {
    logger.info('HTTPS Server listening at https://localhost:3000'); // Log that the server is listening
});
