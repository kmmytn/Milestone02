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

// Example of setting the secure flag for cookies
app.use((req, res, next) => {
  res.cookie('connect.sid', 'value', {
    secure: true, // Ensures the browser only sends the cookie over HTTPS
    httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not client JavaScript
    sameSite: 'strict' // Mitigates CSRF attacks by restricting the cookie to same-site requests
  });
  next();
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));

// Use sessions
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30000 } // 30 seconds for trial
}));

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
