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

    // Validate phone number
    const isValidInternational = /^\+\d{1,3}\s?\(\d{1,3}\)\s?\d{1,3}-\d{1,4}$/.test(phone_number);
    const isValidPhilippine = /^(09|\+639)\d{9}$/.test(phone_number);
    if (!isValidInternational &&!isValidPhilippine) {
        return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }

    // Validate email
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailsignup);
    if (!isValidEmail) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W]).{12,64}$/;
    if (!passwordRegex.test(passwordsignup)) {
        return res.status(400).json({ error: 'Password must include uppercase, lowercase letters, digits, special characters, and be 12-64 characters long.' });
    }

    // Check if passwords match
    const confirmPassword = req.body.confirmpassword; // Assuming confirmpassword is sent in the request body
    if (passwordsignup!== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        // Check for duplicate email
        const emailExists = await db.query('SELECT COUNT(*) as count FROM users WHERE email =?', [emailsignup]);
        if (emailExists[0].count > 0) {
            return res.status(409).json({ error: 'Email already exists.' });
        }

        // Check for duplicate phone number
        const phoneExists = await db.query('SELECT COUNT(*) as count FROM users WHERE phone_number =?', [phone_number]);
        if (phoneExists[0].count > 0) {
            return res.status(409).json({ error: 'Phone number already exists.' });
        }

        // If no duplicates found, proceed with user creation
        const hashedPassword = await bcrypt.hash(passwordsignup, 10);

        // Insert user into database
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

router.post('/logout', (req, res) => {
    return res.status(200).json({ message: 'Logged out successfully.' });
});


module.exports = router;