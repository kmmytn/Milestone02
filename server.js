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

// Middleware to parse JSON bodies
app.use(express.json());
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
