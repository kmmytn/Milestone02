// Import required modules
require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const db = require('./database');
const app = express();
const fs = require('fs');
const https = require('https');
const session = require('express-session');
const path = require('path');
const logger = require('./logger');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Paths to your SSL certificate and key
const privateKey = fs.readFileSync('server.key', 'utf8');
const certificate = fs.readFileSync('server.cert', 'utf8');

// Credentials object
const credentials = {
    key: privateKey,
    cert: certificate
};

// Use helmet to set security-related HTTP headers
app.use(helmet());
app.use(cookieParser());

// Middleware to parse JSON bodies
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));

// Use sessions
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: true,
        httpOnly: true,
        path: '/',
        maxAge: 3600000 // 1 hour
    },
    genid: function(req) { // Custom session ID generator
        return crypto.randomBytes(16).toString('hex'); // Generates a 32-character long session ID
    }
}));

// Setup CSRF protection
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Middleware to set CSRF token in the response locals and in a cookie
app.use((req, res, next) => {
    const token = req.csrfToken();
    res.cookie('XSRF-TOKEN', token); // Set CSRF token in a cookie named 'XSRF-TOKEN'
    res.locals.csrfToken = token; // Make CSRF token available in templates
    next();
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
    next();
});

// Use routes
app.use('/', routes);

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Create HTTPS server
const httpsServer = https.createServer(credentials, app);

// Start the HTTPS server
httpsServer.listen(3000, () => {
    logger.info('HTTPS Server listening at https://localhost:3000');
});
