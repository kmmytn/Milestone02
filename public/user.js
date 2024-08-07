const { type } = require("os");

// Function to get the CSRF token from the cookie
function getCsrfToken() {
    try {
        const name = 'CSRF-TOKEN=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim();
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    } catch (error) {
        handleError('Error getting CSRF token', error);
        return '';
    } finally {
        console.log('CSRF token retrieval attempted');
    }
}

// Function to send log messages to the server
async function sendLog(type, email, message) {
    const csrfToken = getCsrfToken();
    try {
        const response = await fetch('/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken // Include CSRF token in headers
            },
            body: JSON.stringify({
                type: type,
                email: email,  // Ensure a default value if email is not provided
                message: message,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Invalid CSRF token');
            } else {
                throw new Error('Failed to send log');
            }
        }

        console.info('Log sent successfully');
    } catch (error) {
        // Avoid calling sendLog here to prevent recursion
        console.error('Error sending log:', error);
    } finally {
        console.log('Completed log operation');
    }
}

async function sendErrorLog(email, context) {
    const csrfToken = getCsrfToken();

    try {
        const response = await fetch('/log-error', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken // Include CSRF token in headers
            },
            body: JSON.stringify({
                type: 'error',
                email: email,
                message: `${context}`,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            // Handle response errors
            if (response.status === 403) {
                throw new Error('Invalid CSRF token');
            } else {
                throw new Error('Failed to send error log');
            }
        }

        console.info('Error log sent successfully');
    } catch (logError) {
        console.error('Error sending error log:', logError);
    } finally {
        console.log('Completed error log operation');
    }
}


// Centralized error handling function
function handleError(context, error, email) {
    // Log to console for immediate visibility
    console.error(`${context}: ${error.message}`);

    // Send log to the server if necessary
    sendErrorLog(type,email, `${context}: ${error.message}`);
}

// Log actions for authentication, transactions, and administrative actions
function logAuthenticationAction(email, action) {
    sendLog('authentication', email, `User performed authentication action: ${action}`);
}

function logTransactionAction(email, action) {
    sendLog('transaction', email, `User performed transaction action: ${action}`);
}

function logAction(email, action) {
    sendLog('action', email, `User performed action: ${action}`);
}

// Main function to execute on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    const adminForm = document.getElementById('admin-form');
    const postsContainer = document.getElementById('posts-container');
    const adminInput = document.getElementById('admin-input');
    const charCount = document.getElementById('char-count');

    // Character count update
    adminInput.addEventListener('input', () => {
        const remaining = 250 - adminInput.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    // Function to fetch and display posts
    function fetchAndDisplayPosts(currentUserEmail) {
        fetch('/posts')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch posts');
                }
                return response.json();
            })
            .then(data => {
                try {
                    const { currentUserId, posts } = data;
                    postsContainer.innerHTML = ''; // Clear existing posts
                    posts.forEach(post => {
                        const newPost = createPostElement(
                            post.id, 
                            sanitizeInput(post.content), 
                            post.price, 
                            post.quantity, 
                            post.status, 
                            sanitizeInput(post.username), 
                            currentUserId, 
                            post.user_id
                        );
                        postsContainer.appendChild(newPost);
                    });
                    logTransactionAction(currentUserEmail, 'Fetched and displayed posts');
                } catch (error) {
                    handleError('Error processing posts data', error, currentUserEmail);
                }
            })
            .catch(error => {
                handleError('Error fetching posts', error, currentUserEmail);
            });
    }

    // Session check
    fetch('/check-session')
        .then(response => {
            if (!response.ok) {
                throw new Error('Session check failed');
            }
            return response.json();
        })
        .then(data => {
            try {
                if (data.error || !data.roles.includes('user')) {
                    window.location.href = 'index.html';
                } else {
                    document.body.classList.remove('hidden');
                    const currentUserId = data.userId; // Get user ID from session check
                    const currentUserEmail = data.userEmail; // Use currentUserEmail from session check
                    logAuthenticationAction(currentUserEmail, 'Session check passed');

                    adminForm.addEventListener('submit', function (event) {
                        event.preventDefault();

                        const tweetContent = adminInput.value.trim();
                        const price = parseFloat(document.getElementById('price-input').value.trim());
                        const quantity = parseInt(document.getElementById('quantity-input').value.trim());

                        if (isNaN(price) || isNaN(quantity) || price <= 0 || quantity <= 0) {
                            alert('Please enter valid numeric values for price and quantity.');
                            logTransactionAction(currentUserEmail, 'Invalid price or quantity entered');
                            return;
                        }

                        if (tweetContent.length > 250) {
                            alert('Tweet content must be 250 characters or less.');
                            logTransactionAction(currentUserEmail, 'Tweet content exceeded 250 characters');
                            return;
                        }

                        const postData = {
                            content: sanitizeInput(tweetContent),
                            price: price,
                            quantity: quantity,
                            status: 'Available'
                        };

                        logTransactionAction(currentUserEmail, 'Sending post data: ' + JSON.stringify(postData));

                        fetch('/posts', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'CSRF-Token': getCsrfToken() // Include CSRF token in headers
                            },
                            body: JSON.stringify(postData)
                        })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Failed to create post');
                                }
                                return response.json();
                            })
                            .then(data => {
                                if (data.error) {
                                    handleError('Error creating post', new Error(data.error), currentUserEmail);
                                } else {
                                    const newPost = createPostElement(
                                        data.postId, 
                                        sanitizeInput(tweetContent), 
                                        price, 
                                        quantity, 
                                        'Available', 
                                        sanitizeInput(data.username), 
                                        currentUserId, 
                                        data.userId
                                    );
                                    postsContainer.appendChild(newPost);

                                    adminInput.value = '';
                                    document.getElementById('price-input').value = '';
                                    document.getElementById('quantity-input').value = '';
                                    charCount.textContent = '250 characters remaining';
                                    logTransactionAction(currentUserEmail, 'Post created successfully');

                                    // Enable status dropdown for the new post
                                    const statusDropdown = newPost.querySelector('.post-category');
                                    statusDropdown.disabled = false; // Enable dropdown immediately
                                }
                            })
                            .catch(error => {
                                handleError('Error creating post', error, currentUserEmail);
                            });
                    });

                    // Fetch and display posts initially
                    fetchAndDisplayPosts(currentUserEmail);
                }
            } catch (error) {
                handleError('Error during session check', error, currentUserEmail);
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            handleError('Session check failed', error, currentUserEmail);
            window.location.href = 'index.html';
        });

    // Function to create post element
    function createPostElement(postId, content, price, quantity, status, username, currentUserId, postUserId) {
        const newPost = document.createElement('div');
        newPost.classList.add('post');
        newPost.dataset.postId = postId; // Store post ID for future reference

        newPost.innerHTML = `
            <div class="post-header">
                <h3>${username}</h3>
                <div class="action-buttons">
                    <select title="categories" class="post-category btn bkg">
                        <option value="Available"${status === 'Available' ? ' selected' : ''}>Available</option>
                        <option value="Sold"${status === 'Sold' ? ' selected' : ''}>Sold</option>
                    </select>
                </div>
            </div>
            <p class="post-text">${content}</p>
            <div class="post-price-quantity">
                <p>Price: PHP <span class="post-price">${price}</span></p>
                <p>Quantity: <span class="post-quantity">${quantity}</span></p>
            </div>
            <div class="post-details">
                <p class="post-date">${new Date().toLocaleString()}</p>
            </div>
        `;

        // Update status logic
        const statusDropdown = newPost.querySelector('.post-category');
        if (currentUserId === postUserId) {
            statusDropdown.disabled = false; // Ensure it's enabled for the owner
            statusDropdown.addEventListener('change', () => {
                fetch(`/update-post-status/${postId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': getCsrfToken(), // Include CSRF token in headers
                    },
                    body: JSON.stringify({ status: statusDropdown.value }),
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then((data) => {
                        if (data.error) {
                            handleError('Error updating post status', new Error(data.error), currentUserEmail);
                        } else {
                            logTransactionAction(currentUserEmail, `Post status updated to ${statusDropdown.value}`);
                        }
                    })
                    .catch((error) => {
                        handleError('Error updating post status', error, currentUserEmail);
                    });
            });
        } else {
            statusDropdown.disabled = true; // Disable the dropdown if the user is not the owner
        }

        return newPost;
    }

    // Function to sanitize input
    function sanitizeInput(input) {
        try {
            const tempDiv = document.createElement('div');
            tempDiv.textContent = input;
            return tempDiv.innerHTML;
        } catch (error) {
            handleError('Error sanitizing input', error);
            return input;
        }
    }
});
