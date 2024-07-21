require('dotenv').config();
const express = require('express');
const upload = require('./uploads');
const db = require('./database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

const router = express.Router();


// Configuration for debug mode
const config = {
    debug: process.env.DEBUG === 'true'
};

console.log(`Debug mode is ${config.debug}`);

// Utility function to handle errors
const handleError = (res, err, message) => {
    if (config.debug) {
        logger.error(`${message}: ${err.stack}`);
        return res.status(500).json({ error: message, stack: err.stack });
    } else {
        logger.error(`${message}: ${err.message}`);
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

const validateFile = async (req, res, next) => {
    // Check if a file is provided
    if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
    }

    try {
        // Read the uploaded file as a buffer
        const buffer = await fs.promises.readFile(req.file.path);

        // Dynamically import the 'file-type' library
        const { fileTypeFromBuffer } = await import('file-type');

        // Determine the file type from the buffer
        const type = await fileTypeFromBuffer(buffer);

        // Define valid MIME types
        const validMimeTypes = ['image/jpeg', 'image/png'];

        // Check if the detected file type is valid
        if (!type || !validMimeTypes.includes(type.mime)) {
            await unlink(req.file.path);
            return res.status(400).json({ error: 'Invalid file type. Only JPEG/PNG images allowed.' });
        }

        // Proceed to the next middleware function if the file is valid
        next();
    } catch (err) {
        // Handle any errors that occur during file validation
        return handleError(res, err, 'Error validating file.');
    }
};


router.post('/signup', upload.single('pfp'), validateFile, async (req, res) => {
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
                    logger.warn(`Signup attempt with existing email: ${emailsignup}`);
                    return res.status(400).json({ error: 'Email already exists.' });
                } else {
                    return handleError(res, err, 'Error signing up.');
                }
            }

            // Assign user role to the user
            const userId = result.insertId;
            const roleSql = 'INSERT INTO user_roles (user_id, role_id) VALUES (?, (SELECT id FROM roles WHERE name = "user"))';
            db.query(roleSql, [userId], (roleErr) => {
                if (roleErr) {
                    return handleError(res, roleErr, 'Error assigning user role.');
                }
                logger.info(`User signed up successfully: ${emailsignup}`);
                res.status(200).json({ message: 'Signed up successfully.' });
            });
        });
    } catch (hashErr) {
        return handleError(res, hashErr, 'Failed to hash password.');
    }
});


router.post('/login', trackLoginAttempts, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const sql = 'SELECT id, password, full_name, email FROM users WHERE email = ?';
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

            req.session.user = { id: user.id, email: user.email, full_name: user.full_name };
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

                    logger.info(`User logged in successfully: ${email}`);
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
    const currentUserId = req.session.user.id;
    const query = `
        SELECT posts.id, posts.content, posts.price, posts.quantity, posts.status, posts.created_at, users.full_name as username, posts.user_id
        FROM posts
        JOIN users ON posts.user_id = users.id
    `;
    db.query(query, (err, results) => {
        if (err) {
            return handleError(res, err, 'Database query error');
        }
        res.json({ currentUserId, posts: results });
    });
});

router.post('/posts', isAuthenticated, (req, res) => {

    const { content, price, quantity, status } = req.body;
    if (!content || !price || !quantity || !status) {
        logger.error('Invalid post data:', req.body); // Log invalid data
        return res.status(400).send('Invalid post data');
    }

    const query = 'INSERT INTO posts (user_id, content, price, quantity, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
    db.query(query, [req.session.user.id, content, price, quantity, status], (err, result) => {
        if (err) {
            logger.error('Database error:', err); // Log database errors
            return handleError(res, err, 'Database query error');
        }

        // Fetch the username of the user who created the post
        const fetchUserQuery = 'SELECT full_name as username FROM users WHERE id = ?';
        db.query(fetchUserQuery, [req.session.user.id], (userErr, userResult) => {
            if (userErr) {
                return handleError(res, userErr, 'Database query error');
            }

            const username = userResult[0].username;
            res.json({ message: 'Post created successfully', postId: result.insertId, username });
            logger.info(`Post created by ${username}`);
        });
    });
});

router.put('/posts/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    const { content, price, quantity, status } = req.body;
    const query = 'UPDATE posts SET content = ?, price = ?, quantity = ?, status = ? WHERE id = ?';
    db.query(query, [content, price, quantity, status, id], (err, result) => {
        if (err) {
            return handleError(res, err, 'Database query error');
        }
        res.json({ message: 'Post updated successfully' });
    });
});


router.delete('/posts/:id', isAuthenticated, isAdmin, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM posts WHERE id = ?';
    db.query(query, [id], (err, result) => {
        if (err) {
            return handleError(res, err, 'Database query error');
        }
        res.json({ message: 'Post deleted successfully' });
    });
});

router.put('/update-post-status/:id', isAuthenticated, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const query = 'UPDATE posts SET status = ? WHERE id = ?';
    db.query(query, [status, id], (err, result) => {
        if (err) {
            return handleError(res, err, 'Database query error');
        }
        res.json({ message: 'Post status updated successfully' });
    });
});

// Middleware to check if the user is an admin
const isAdminPage = (req, res, next) => {
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

// Middleware to check if the user is authenticated
const isUserPage = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

router.get('/admin.html', isAdminPage, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

router.get('/user.html', isUserPage, (req, res) => {
    res.sendFile(path.join(__dirname, 'user.html'));
});

router.post('/logout', (req, res) => {
    const userEmail = req.session.user ? req.session.user.email : 'Unknown user';
    req.session.destroy((err) => {
        if (err) {
            logger.error(`Error destroying session for user: ${userEmail}`);
            return res.status(500).json({ error: 'Logout failed.' });
        }
        logger.info(`User logged out: ${userEmail}`);
        return res.status(200).json({ message: 'Logged out successfully.' });
    });
});


router.post('/log', (req, res) => {
    const { type, email, message, timestamp } = req.body;
    logger.log({
        level: 'info',
        message: `${type} - ${email}: ${message}`,
        timestamp: timestamp
    });

    console.log('log data:', req.body);  // Log to console for debugging

    res.status(200).send('Log received');
});



// Middleware to check session timeout
function checkSessionTimeout(req, res, next) {
    if (req.session.user) {
        if (Date.now() - req.session.lastActivity > 30000) { // 30 seconds
            req.session.destroy();
            logger.warn('Session timed out');
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
        logger.warn(`Too many login attempts from IP: ${ip}`);
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
        logger.warn(`IP ${ip} locked due to too many login attempts`);
        return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    } else {
        const remainingAttempts = 3 - userAttempts.attempts;
        return res.status(401).json({ error: `Invalid email or password. You have ${remainingAttempts} more attempts.` });
    }
}

router.get('/check-session', checkSessionTimeout, (req, res) => {
    if (req.session.user) {
        res.status(200).json({ message: 'Session active.', roles: req.session.roles, userId: req.session.user.id, userEmail: req.session.user.email });
    } else {
        res.status(401).json({ error: 'Session expired.' });
    }
});

module.exports = router;
