require('dotenv').config(); // Load environment variables from .env file
const express = require('express'); // Import Express framework
const upload = require('./uploads'); // Import custom upload module
const db = require('./database'); // Import custom database module
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const crypto = require('crypto'); // Import crypto module for generating random values
const { promisify } = require('util'); // Import promisify function to convert callback-based functions to promise-based
const fs = require('fs'); // Import file system module
const path = require('path'); // Import path module for handling file paths
const logger = require('./logger'); // Import custom logger module

const readFile = promisify(fs.readFile); // Convert fs.readFile to a promise-based function
const unlink = promisify(fs.unlink); // Convert fs.unlink to a promise-based function

const router = express.Router(); // Create a new router object

// Configuration for debug mode
const config = {
    debug: process.env.DEBUG === 'true' // Set debug mode based on environment variable
};

console.log(`Debug mode is ${config.debug}`); // Log the debug mode status

// Utility function to handle errors
const handleError = (res, err, message) => {
    if (config.debug) { // If in debug mode
        logger.error(`${message}: ${err.stack}`); // Log error stack trace
        return res.status(500).json({ error: message, stack: err.stack }); // Send error response with stack trace
    } else {
        logger.error(`${message}: ${err.message}`); // Log error message
        return res.status(500).json({ error: message }); // Send error response without stack trace
    }
};

// Function to validate email
const isValidEmail = (email) => {
    const atSymbolIndex = email.indexOf('@'); // Find the position of the @ symbol
    if (atSymbolIndex === -1) return false; // Return false if @ symbol is not found

    const localPart = email.slice(0, atSymbolIndex); // Extract the local part of the email
    const domainPart = email.slice(atSymbolIndex + 1); // Extract the domain part of the email

    return localPart.length <= 64 && domainPart.length <= 255; // Validate lengths of local and domain parts
};

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) { // If user is authenticated
        return next(); // Proceed to the next middleware
    }
    res.status(401).json({ error: 'Unauthorized' }); // Send unauthorized response
};

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    if (!req.session.user) { // If user is not authenticated
        return res.status(401).json({ error: 'Unauthorized' }); // Send unauthorized response
    }
    const query = 'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?'; // Query to get user roles
    db.query(query, [req.session.user.id], (err, results) => { // Execute query
        if (err || results.length === 0 || !results.some(role => role.name === 'admin')) { // If error or no admin role
            return res.status(403).json({ error: 'Forbidden. Admin access required.' }); // Send forbidden response
        }
        next(); // Proceed to the next middleware
    });
};

// Middleware to validate uploaded file
const validateFile = async (req, res, next) => {
    if (!req.file) { // If no file is uploaded
        return res.status(400).json({ error: 'File is required' }); // Send bad request response
    }

    try {
        const buffer = await fs.promises.readFile(req.file.path); // Read uploaded file as buffer

        const { fileTypeFromBuffer } = await import('file-type'); // Dynamically import file-type library

        const type = await fileTypeFromBuffer(buffer); // Determine file type from buffer

        const validMimeTypes = ['image/jpeg', 'image/png']; // Define valid MIME types

        if (!type || !validMimeTypes.includes(type.mime)) { // If file type is invalid
            await unlink(req.file.path); // Delete uploaded file
            return res.status(400).json({ error: 'Invalid file type. Only JPEG/PNG images allowed.' }); // Send bad request response
        }

        next(); // Proceed to the next middleware if file is valid
    } catch (err) {
        return handleError(res, err, 'Error validating file.'); // Handle any errors during file validation
    }
};

// Route to handle user signup
router.post('/signup', upload.single('pfp'), validateFile, async (req, res) => {
    const { full_name, emailsignup, phone_number, passwordsignup, confirmpassword } = req.body; // Extract form data
    const profilePicturePath = req.file ? req.file.path : null; // Handle file upload

    if (!isValidEmail(emailsignup)) { // Validate email
        return res.status(400).json({ error: 'Please enter a valid email address.' }); // Send bad request response
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W]).{12,64}$/; // Define password regex
    if (!passwordRegex.test(passwordsignup)) { // Validate password
        return res.status(400).json({ error: 'Password must include uppercase, lowercase letters, digits, special characters, and be 12-64 characters long.' }); // Send bad request response
    }

    if (passwordsignup !== confirmpassword) { // Check if passwords match
        return res.status(400).json({ error: 'Passwords do not match.' }); // Send bad request response
    }

    try {
        const hashedPassword = await bcrypt.hash(passwordsignup, 10); // Hash the password

        const sql = 'INSERT INTO users (full_name, email, phone_number, password, profile_picture) VALUES (?,?,?,?,?)'; // SQL query to insert user
        db.query(sql, [full_name, emailsignup, phone_number, hashedPassword, profilePicturePath], (err, result) => { // Execute query
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') { // If email already exists
                    logger.warn(`Signup attempt with existing email: ${emailsignup}`); // Log warning
                    return res.status(400).json({ error: 'Email already exists.' }); // Send bad request response
                } else {
                    return handleError(res, err, 'Error signing up.'); // Handle any other errors
                }
            }

            const userId = result.insertId; // Get the inserted user ID
            const roleSql = 'INSERT INTO user_roles (user_id, role_id) VALUES (?, (SELECT id FROM roles WHERE name = "user"))'; // SQL query to assign user role
            db.query(roleSql, [userId], (roleErr) => { // Execute query
                if (roleErr) {
                    return handleError(res, roleErr, 'Error assigning user role.'); // Handle any errors
                }
                logger.info(`User signed up successfully: ${emailsignup}`); // Log success message
                res.status(200).json({ message: 'Signed up successfully.' }); // Send success response
            });
        });
    } catch (hashErr) {
        return handleError(res, hashErr, 'Failed to hash password.'); // Handle hashing errors
    }
});

// Route to handle user login
router.post('/login', trackLoginAttempts, async (req, res) => { // Apply trackLoginAttempts middleware here
    const { email, password } = req.body; // Extract form data

    if (!email || !password) { // Check if email and password are provided
        return res.status(400).json({ error: 'Email and password are required.' }); // Send bad request response
    }

    try {
        const sql = 'SELECT id, password, full_name, email FROM users WHERE email = ?'; // SQL query to get user by email
        db.query(sql, [email], async (err, results) => { // Execute query
            if (err) {
                return handleError(res, err, 'Error logging in.'); // Handle any errors
            }

            if (results.length === 0) { // If no user found
                return handleFailedLoginAttempt(req, res); // Handle failed login attempt
            }

            const user = results[0]; // Get the user
            const passwordMatch = await bcrypt.compare(password, user.password); // Compare passwords

            if (!passwordMatch) { // If passwords do not match
                return handleFailedLoginAttempt(req, res); // Handle failed login attempt
            }

            renewSession(req, res, async (renewErr) => { // Renew the session ID after successful authentication
                if (renewErr) {
                    return handleError(res, renewErr, 'Error renewing session.'); // Handle any errors
                }

                req.session.user = { id: user.id, email: user.email, full_name: user.full_name }; // Set user session
                req.session.lastActivity = Date.now(); // Set last activity time

                const insertSessionSql = 'INSERT INTO sessions (user_id, session_id) VALUES (?, ?)'; // SQL query to insert session ID
                db.query(insertSessionSql, [user.id, req.sessionID], (sessionErr) => { // Execute query
                    if (sessionErr) {
                        return handleError(res, sessionErr, 'Error inserting session ID.'); // Handle any errors
                    }

                    const roleSql = 'SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?'; // SQL query to get user roles
                    db.query(roleSql, [user.id], (roleErr, roleResults) => { // Execute query
                        if (roleErr) {
                            return handleError(res, roleErr, 'Error fetching user roles.'); // Handle any errors
                        }

                        const roles = roleResults.map(role => role.name); // Map roles to array

                        req.session.roles = roles; // Store roles in session

                        logger.info(`User logged in successfully: ${email}`); // Log success message
                        res.status(200).json({
                            message: 'Logged in successfully.',
                            sessionId: req.sessionID, // Return renewed session ID
                            roles // Return roles to the client
                        });
                    });
                });
            });
        });
    } catch (err) {
        return handleError(res, err, 'Server error.'); // Handle any other errors
    }
});

// Route to fetch posts
router.get('/posts', isAuthenticated, (req, res) => {
    try {
        const currentUserId = req.session.user.id; // Get current user ID from session
        const query = `
            SELECT posts.id, posts.content, posts.price, posts.quantity, posts.status, posts.created_at, users.full_name as username, posts.user_id
            FROM posts
            JOIN users ON posts.user_id = users.id
        `; // SQL query to get posts
        db.query(query, (err, results) => { // Execute query
            if (err) {
                return handleError(res, err, 'Database query error'); // Handle any errors
            }
            res.json({ currentUserId, posts: results }); // Send posts and current user ID as response
        });
    } catch (error) {
        return handleError(res, error, 'Error fetching posts'); // Handle any other errors
    }
});

// Route to create a new post
router.post('/posts', isAuthenticated, (req, res) => {
    try {
        const { content, price, quantity, status } = req.body; // Extract form data
        if (!content || !price || !quantity || !status) { // Validate form data
            logger.error('Invalid post data:', req.body); // Log invalid data
            return res.status(400).send('Invalid post data'); // Send bad request response
        }

        const query = 'INSERT INTO posts (user_id, content, price, quantity, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())'; // SQL query to insert post
        db.query(query, [req.session.user.id, content, price, quantity, status], (err, result) => { // Execute query
            if (err) {
                logger.error('Database error:', err); // Log database errors
                return handleError(res, err, 'Database query error'); // Handle any errors
            }

            const fetchUserQuery = 'SELECT full_name as username FROM users WHERE id = ?'; // SQL query to get username of post creator
            db.query(fetchUserQuery, [req.session.user.id], (userErr, userResult) => { // Execute query
                if (userErr) {
                    return handleError(res, userErr, 'Database query error'); // Handle any errors
                }

                const username = userResult[0].username; // Get username
                res.json({ message: 'Post created successfully', postId: result.insertId, username }); // Send success response
                logger.info(`Post created by ${username}`); // Log success message
            });
        });
    } catch (error) {
        return handleError(res, error, 'Error creating post'); // Handle any other errors
    }
});

// Route to update a post (admin only)
router.put('/posts/:id', isAuthenticated, isAdmin, (req, res) => {
    try {
        const { id } = req.params; // Extract post ID from URL parameters
        const { content, price, quantity, status } = req.body; // Extract form data
        const query = 'UPDATE posts SET content = ?, price = ?, quantity = ?, status = ? WHERE id = ?'; // SQL query to update post
        db.query(query, [content, price, quantity, status, id], (err, result) => { // Execute query
            if (err) {
                return handleError(res, err, 'Database query error'); // Handle any errors
            }
            res.json({ message: 'Post updated successfully' }); // Send success response
        });
    } catch (error) {
        return handleError(res, error, 'Error updating post'); // Handle any other errors
    }
});

// Route to delete a post (admin only)
router.delete('/posts/:id', isAuthenticated, isAdmin, (req, res) => {
    try {
        const { id } = req.params; // Extract post ID from URL parameters
        const query = 'DELETE FROM posts WHERE id = ?'; // SQL query to delete post
        db.query(query, [id], (err, result) => { // Execute query
            if (err) {
                return handleError(res, err, 'Database query error'); // Handle any errors
            }
            res.json({ message: 'Post deleted successfully' }); // Send success response
        });
    } catch (error) {
        return handleError(res, error, 'Error deleting post'); // Handle any other errors
    }
});

// Route to update post status
router.put('/update-post-status/:id', isAuthenticated, (req, res) => {
    try {
        const { id } = req.params; // Extract post ID from URL parameters
        const { status } = req.body; // Extract status from form data

        const query = 'UPDATE posts SET status = ? WHERE id = ?'; // SQL query to update post status
        db.query(query, [status, id], (err, result) => { // Execute query
            if (err) {
                return handleError(res, err, 'Database query error'); // Handle any errors
            }
            res.json({ message: 'Post status updated successfully' }); // Send success response
        });
    } catch (error) {
        return handleError(res, error, 'Error updating post status'); // Handle any other errors
    }
});

// Middleware to check if the user is authenticated for user page
const isUserPage = (req, res, next) => {
    if (!req.session.user) { // If user is not authenticated
        return res.status(401).json({ error: 'Unauthorized' }); // Send unauthorized response
    }
    next(); // Proceed to the next middleware
};

// Route to serve admin page (admin only)
router.get('/admin.html', isAdmin, (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'admin.html')); // Send admin.html file
    } catch (error) {
        return handleError(res, error, 'Error loading admin page'); // Handle any errors
    }
});

// Route to serve user page
router.get('/user.html', isUserPage, (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'user.html')); // Send user.html file
    } catch (error) {
        return handleError(res, error, 'Error loading user page'); // Handle any errors
    }
});

// Route to handle user logout
router.post('/logout', (req, res) => {
    try {
        const userEmail = req.session.user ? req.session.user.email : 'Unknown user'; // Get user email from session
        req.session.destroy((err) => { // Destroy user session
            if (err) {
                logger.error(`Error destroying session for user: ${userEmail}`); // Log error
                return res.status(500).json({ error: 'Logout failed.' }); // Send server error response
            }
            logger.info(`User logged out: ${userEmail}`); // Log success message
            return res.status(200).json({ message: 'Logged out successfully.' }); // Send success response
        });
    } catch (error) {
        return handleError(res, error, 'Error logging out'); // Handle any other errors
    }
});

// Route to log messages
router.post('/log', (req, res) => {
    try {
        const { type, email, message, timestamp } = req.body; // Extract log data
        logger.log({
            level: 'info',
            message: `${type} - ${email}: ${message}`,
            timestamp: timestamp
        });

        console.log('log data:', req.body);  // Log to console for debugging

        res.status(200).send('Log received'); // Send success response
    } catch (error) {
        return handleError(res, error, 'Error logging data'); // Handle any errors
    }
});

// Route to log errors
router.post('/log-error', (req, res) => {
    try {
        const { type, email, message, timestamp } = req.body; // Extract log data
        logger.log({
            level: 'error',
            message: `${type} - ${email}: ${message}`,
            timestamp: timestamp
        });

        console.log('log data:', req.body);  // Log to console for debugging

        res.status(200).send('Log received'); // Send success response
    } catch (error) {
        return handleError(res, error, 'Error logging data'); // Handle any errors
    }
});

// Middleware to check session timeout
function checkSessionTimeout(req, res, next) {
    try {
        if (req.session.user) { // If user is authenticated
            if (Date.now() - req.session.lastActivity > 30000) { // Check if session is timed out (30 seconds)
                req.session.destroy(); // Destroy session
                logger.warn('Session timed out'); // Log warning
                return res.status(401).json({ error: 'Session timed out. Please log in again.' }); // Send unauthorized response
            } else {
                req.session.lastActivity = Date.now(); // Update last activity time
            }
        }
        next(); // Proceed to the next middleware
    } catch (error) {
        return handleError(res, error, 'Error checking session timeout'); // Handle any errors
    }
}

// Middleware to track login attempts
function trackLoginAttempts(req, res, next) {
    try {
        const ip = req.ip; // Get client IP address
        if (!req.session.loginAttempts) { // Initialize login attempts if not present
            req.session.loginAttempts = {};
        }
        if (!req.session.loginAttempts[ip]) { // Initialize login attempts for IP if not present
            req.session.loginAttempts[ip] = { attempts: 0, lockUntil: null };
        }
        const userAttempts = req.session.loginAttempts[ip]; // Get login attempts for IP
        if (userAttempts.lockUntil && userAttempts.lockUntil > Date.now()) { // Check if IP is locked
            logger.warn(`Too many login attempts from IP: ${ip}`); // Log warning
            return res.status(429).json({ error: 'Too many login attempts. Please try again later.' }); // Send too many requests response
        }
        next(); // Proceed to the next middleware
    } catch (error) {
        return handleError(res, error, 'Error tracking login attempts'); // Handle any errors
    }
}

// Function to handle failed login attempt
function handleFailedLoginAttempt(req, res) {
    try {
        const ip = req.ip; // Get client IP address
        const userAttempts = req.session.loginAttempts[ip]; // Get login attempts for IP
        userAttempts.attempts += 1; // Increment login attempts
        if (userAttempts.attempts >= 3) { // Check if attempts exceed limit
            userAttempts.lockUntil = Date.now() + 30000; // Lock IP for 30 seconds
            logger.warn(`IP ${ip} locked due to too many login attempts`); // Log warning
            return res.status(429).json({ error: 'Too many login attempts. Please try again later.' }); // Send too many requests response
        } else {
            const remainingAttempts = 3 - userAttempts.attempts; // Calculate remaining attempts
            return res.status(401).json({ error: `Invalid email or password. You have ${remainingAttempts} more attempts.` }); // Send unauthorized response
        }
    } catch (error) {
        return handleError(res, error, 'Error handling failed login attempt'); // Handle any errors
    }
}

// Route to check session status
router.get('/check-session', checkSessionTimeout, (req, res) => {
    try {
        if (req.session && req.session.user) { // If session is active
            res.status(200).json({
                message: 'Session active.',
                roles: req.session.roles, // Return user roles
                userId: req.session.user.id, // Return user ID
                userEmail: req.session.user.email // Return user email
            });
        } else {
            res.status(401).json({ error: 'Session expired.' }); // Send unauthorized response if session expired
        }
    } catch (error) {
        console.error('Session Check Error:', error); // Log error
        return handleError(res, error, 'Error checking session'); // Handle any errors
    }
});

// Middleware to validate session
function validateSession(req, res, next) {
    try {
        const sessionId = req.sessionID; // Get session ID
        const sql = 'SELECT * FROM sessions WHERE session_id = ?'; // SQL query to validate session
        db.query(sql, [sessionId], (err, results) => { // Execute query
            if (err || results.length === 0) { // If error or session not found
                return res.status(401).json({ error: 'Invalid session.' }); // Send unauthorized response
            }
            next(); // Proceed to the next middleware
        });
    } catch (error) {
        return handleError(res, error, 'Error validating session'); // Handle any errors
    }
}

// Apply validateSession middleware globally
router.use(validateSession);

// Middleware to renew session
function renewSession(req, res, next) {
    try {
        const oldSessionId = req.sessionID; // Get old session ID
        req.session.regenerate((err) => { // Regenerate session ID
            if (err) {
                return next(err); // Handle any errors
            }
            const newSessionId = req.sessionID; // Get new session ID
            logger.info(`Renewed session from ${oldSessionId} to ${newSessionId}`); // Log session renewal
            next(); // Proceed to the next middleware
        });
    } catch (error) {
        return handleError(res, error, 'Error renewing session'); // Handle any errors
    }
}

// Route to get session ID
router.get('/session-id', (req, res) => {
    try {
        res.json({ sessionId: req.sessionID }); // Send session ID as response
    } catch (error) {
        return handleError(res, error, 'Error fetching session ID'); // Handle any errors
    }
});

module.exports = router; // Export the router
