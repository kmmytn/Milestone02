const express = require('express');
const upload = require('./uploads');
const db = require('./database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const router = express.Router();

// Configuration for debug mode
const config = {
    debug: process.env.DEBUG === 'true', // Read the debug mode from environment variable
};

// Utility function to handle errors
const handleError = (res, err, message) => {
    if (config.debug) {
        return res.status(500).json({ error: message, stack: err.stack });
    } else {
        return res.status(500).json({ error: message });
    }
};

// Function to validate email
const isValidEmail = (email) => {
    const atSymbolIndex = email.indexOf('@');
    if (atSymbolIndex === -1) return false;

    const localPart = email.slice(0, atSymbolIndex);
    const domainPart = email.slice(atSymbolIndex + 1);

    return localPart.length <= 64 && domainPart.length <= 255;
};

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const query = 'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?';
    db.query(query, [req.session.user.id], (err, results) => {
        if (err || results.length === 0 || !results.some(role => role.name === 'admin')) {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }
        next();
    });
};

router.post('/signup', upload.single('pfp'), async (req, res) => {
    const { full_name, emailsignup, phone_number, passwordsignup, confirmpassword } = req.body;
    const profilePicturePath = req.file ? req.file.path : null; // Handle file upload

    // Validate email
    if (!isValidEmail(emailsignup)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W]).{12,64}$/;
    if (!passwordRegex.test(passwordsignup)) {
        return res.status(400).json({ error: 'Password must include uppercase, lowercase letters, digits, special characters, and be 12-64 characters long.' });
    }

    // Check if passwords match
    if (passwordsignup !== confirmpassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(passwordsignup, 10);

        // Insert user into database
        const sql = 'INSERT INTO users (full_name, email, phone_number, password, profile_picture) VALUES (?,?,?,?,?)';
        db.query(sql, [full_name, emailsignup, phone_number, hashedPassword, profilePicturePath], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email already exists.' });
                } else {
                    return res.status(500).json({ error: 'Error signing up.' });
                }
            }

            // Assign user role to the user
            const userId = result.insertId;
            const roleSql = 'INSERT INTO user_roles (user_id, role_id) VALUES (?, (SELECT id FROM roles WHERE name = "user"))';
            db.query(roleSql, [userId], (roleErr) => {
                if (roleErr) {
                    return res.status(500).json({ error: 'Error assigning user role.' });
                }
                res.status(200).json({ message: 'Signed up successfully.' });
            });
        });
    } catch (hashErr) {
        return res.status(500).json({ error: 'Failed to hash password.' });
    }
});


router.post('/login', trackLoginAttempts, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const sql = 'SELECT id, password, full_name FROM users WHERE email = ?';
        db.query(sql, [email], async (err, results) => {
            if (err) {
                return handleError(res, err, 'Error logging in.');
            }

            if (results.length === 0) {
                return handleFailedLoginAttempt(req, res);
            }

            const user = results[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (!passwordMatch) {
                return handleFailedLoginAttempt(req, res);
            }

            req.session.user = user;
            req.session.lastActivity = Date.now();
            req.session.loginAttempts[req.ip] = { attempts: 0, lockUntil: null }; // Reset attempts on successful login

            const sessionId = crypto.randomBytes(16).toString('hex'); // Generate a 16-byte session ID

            // Store sessionId in the database
            const sessionSql = 'INSERT INTO sessions (user_id, session_id) VALUES (?, ?)';
            db.query(sessionSql, [user.id, sessionId], (sessionErr) => {
                if (sessionErr) {
                    return handleError(res, sessionErr, 'Error creating session.');
                }

                // Fetch user roles
                const roleSql = 'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?';
                db.query(roleSql, [user.id], (roleErr, roleResults) => {
                    if (roleErr) {
                        return handleError(res, roleErr, 'Error fetching user roles.');
                    }

                    const roles = roleResults.map(role => role.name);

                    // Store roles in session
                    req.session.roles = roles;

                    res.status(200).json({
                        message: 'Logged in successfully.',
                        sessionId,
                        roles // Return roles to the client
                    });
                });
            });
        });
    } catch (err) {
        return handleError(res, err, 'Server error.');
    }
});

router.get('/posts', isAuthenticated, (req, res) => {
    const query = 'SELECT * FROM posts';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json(results);
    });
});

router.post('/posts', isAuthenticated, (req, res) => {
    const { content, price, quantity, status } = req.body;

    console.log('Received post data:', { content, price, quantity, status }); // Log the received data

    const query = 'INSERT INTO posts (user_id, content, price, quantity, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
    db.query(query, [req.session.user.id, content, price, quantity, status], (err, result) => {
        if (err) {
            console.error('Database error:', err); // Log database errors
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Post created successfully', postId: result.insertId });
    });
});

router.put('/posts/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    const { content, price, quantity, status } = req.body;
    const query = 'UPDATE posts SET content = ?, price = ?, quantity = ?, status = ? WHERE id = ?';
    db.query(query, [content, price, quantity, status, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Post updated successfully' });
    });
});

router.delete('/posts/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM posts WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }
        res.json({ message: 'Post deleted successfully' });
    });
});

router.get('/user-info', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const query = 'SELECT full_name FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query error' });
        }
        if (results.length > 0) {
            res.json({ username: results[0].full_name });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    });
});



router.post('/logout', (req, res) => {
    req.session.destroy();
    return res.status(200).json({ message: 'Logged out successfully.' });
});

// Middleware to check session timeout
function checkSessionTimeout(req, res, next) {
    if (req.session.user) {
        if (Date.now() - req.session.lastActivity > 30000) { // 30 seconds
            req.session.destroy();
            return res.status(401).json({ error: 'Session timed out. Please log in again.' });
        } else {
            req.session.lastActivity = Date.now();
        }
    }
    next();
}

// Middleware to track login attempts
function trackLoginAttempts(req, res, next) {
    const ip = req.ip;
    if (!req.session.loginAttempts) {
        req.session.loginAttempts = {};
    }
    if (!req.session.loginAttempts[ip]) {
        req.session.loginAttempts[ip] = { attempts: 0, lockUntil: null };
    }
    const userAttempts = req.session.loginAttempts[ip];
    if (userAttempts.lockUntil && userAttempts.lockUntil > Date.now()) {
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    }
    next();
}

function handleFailedLoginAttempt(req, res) {
    const ip = req.ip;
    const userAttempts = req.session.loginAttempts[ip];
    userAttempts.attempts += 1;
    if (userAttempts.attempts >= 3) {
        userAttempts.lockUntil = Date.now() + 30000; // Lock for 30 seconds after 3 failed attempts
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    } else {
        const remainingAttempts = 3 - userAttempts.attempts;
        return res.status(401).json({ error: `Invalid email or password. You have ${remainingAttempts} more attempts.` });
    }
}

router.get('/check-session', checkSessionTimeout, (req, res) => {
    if (req.session.user) {
        res.status(200).json({ message: 'Session active.' });
    } else {
        res.status(401).json({ error: 'Session expired.' });
    }
});

module.exports = router;
