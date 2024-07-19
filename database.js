const mysql = require('mysql');
const logger = require('./logger');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'cssecdv'
});

db.connect((err) => {
    if (err) {
        logger.error('Error connecting to the database:', err);
        throw err;
    }
    logger.info('Connected to the database.');
});

module.exports = db;
