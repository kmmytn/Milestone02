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

// Function to check file signature
const checkFileSignature = async (filePath) => {
    const buffer = await readFile(filePath);
    const { fileTypeFromBuffer } = await import('file-type');
    const type = await fileTypeFromBuffer(buffer);
    return type;
};

// Function to validate specific byte sequences
const validateFileBytes = (buffer, mime) => {
    // JPEG files start with FF D8
    const jpegSignature = buffer.slice(0, 2).toString('hex') === 'ffd8';
    // PNG files start with 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = buffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';

    if (mime === 'image/jpeg' && jpegSignature) {
        return true;
    }
    if (mime === 'image/png' && pngSignature) {
        return true;
    }
    return false;
};

// Function to validate email
const isValidEmail = (email) => {
    const atSymbolIndex = email.indexOf('@');
    if (atSymbolIndex === -1) return false;

    const localPart = email.slice(0, atSymbolIndex);
    const domainPart = email.slice(atSymbolIndex + 1);

    return localPart.length <= 64 && domainPart.length <= 255;
};

const isAdmin = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    const sql = 'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?';
    db.query(sql, [req.session.user.id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(403).json({ error: 'Forbidden. You do not have access to this resource.' });
        }
        const roles = results.map(role => role.name);
        if (!roles.includes('admin')) {
            return res.status(403).json({ error: 'Forbidden. Admin access required.' });
        }
        next();
    });
};

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    next();
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