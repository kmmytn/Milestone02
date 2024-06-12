const express = require('express');
const upload = require('./uploads');
const db = require('./database');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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
    const { full_name, emailsignup, phone_number, passwordsignup } = req.body;
    const profilePicturePath = req.file? req.file.path : null; // Handle file upload
    

    try {
        const hashedPassword = await bcrypt.hash(passwordsignup, 10);

        // Correctly construct the SQL query with matching placeholders and values
        const sql = 'INSERT INTO users (full_name, email, phone_number, password, profile_picture) VALUES (?,?,?,?,?)';
        db.query(sql, [full_name, emailsignup, phone_number, hashedPassword, profilePicturePath], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error signing up.' });
            }
            res.status(200).json({ message: 'Signed up successfully.' });
        });
    } catch (hashErr) {
        console.error(hashErr);
        return res.status(500).json({ error: 'Failed to hash password.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const sql = 'SELECT id, password, full_name FROM users WHERE email = ?';
        db.query(sql, [email], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error logging in.' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }

            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid email or password.' });
            }

            const sessionId = crypto.randomBytes(16).toString('hex'); // Generate a 16-byte session ID

            // Store sessionId in the database or in-memory store (e.g., Redis)
            const sessionSql = 'INSERT INTO sessions (user_id, session_id) VALUES (?, ?)';
            db.query(sessionSql, [user.id, sessionId], (sessionErr) => {
                if (sessionErr) {
                    console.error(sessionErr);
                    return res.status(500).json({ error: 'Error creating session.' });
                }

                res.status(200).json({
                    message: 'Logged in successfully.',
                    sessionId,
                    role: user.full_name === 'admin' ? 'admin' : 'user' // Determine role based on full_name
                });
            });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error.' });
    }
});


module.exports = router;