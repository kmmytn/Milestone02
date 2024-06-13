// Import required modules
require('dotenv').config();
const express = require('express');
const routes = require('./routes');
const db = require('./database');
const app = express();
const port = 3000;
const session = require('express-session');

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


// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
