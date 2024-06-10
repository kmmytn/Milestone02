// Import required modules
const express = require('express');
const routes = require('./routes'); // Import routes from routes.js
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.use(express.static('public'));

// Connect to MySQL database
const mysql = require('mysql');


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'cssecdv'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database.');
});

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
