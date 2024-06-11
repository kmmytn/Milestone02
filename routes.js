const express = require('express');
const upload = require('./uploads');
const db = require('./database');
const router = express.Router();
const bcrypt = require('bcrypt');

// Example route to get data from the database
router.get('/data', (req, res) => {
    let sql = 'SELECT * FROM your_table';
    db.query(sql, (err, result) => {
        if (err) throw err;
        res.send(result);
    });
});

router.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

router.post('/signup', upload.single('pfp'), async (req, res) => {
    const { full_name, email, phone_number, password } = req.body;
    const profilePicturePath = req.file? req.file.path : null; // Handle file upload

    if (!password) {
        return res.status(400).json({ error: 'Password is required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Construct the SQL query
    const sql = 'INSERT INTO users (full_name, email, phone_number, password, profile_picture) VALUES (?,?,?,?,?)';
    
    // Execute the query
    db.query(sql, [full_name, email, phone_number, hashedPassword, profilePicturePath], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error signing up.' });
        }
        res.status(200).json({ message: 'Signed up successfully.' });
    });
});

module.exports = router;