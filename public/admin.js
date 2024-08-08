// Function to get the CSRF token from the cookie
function getCsrfToken() {
    try {
        const name = 'CSRF-TOKEN='; // Name of the CSRF token cookie
        const decodedCookie = decodeURIComponent(document.cookie); // Decode the document's cookies
        const ca = decodedCookie.split(';'); // Split the cookies into an array
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i].trim(); // Trim any whitespace from each cookie
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length); // Return the CSRF token value
            }
        }
        return ''; // Return empty string if CSRF token not found
    } catch (error) {
        handleError('Error getting CSRF token', error); // Handle any errors
        return ''; // Return empty string on error
    } finally {
        console.log('CSRF token retrieval attempted'); // Log the attempt
    }
}

// Function to send log messages to the server
async function sendLog(type, email, message) {
    const csrfToken = getCsrfToken(); // Get the CSRF token

    try {
        const response = await fetch('/log', {
            method: 'POST', // HTTP method
            headers: {
                'Content-Type': 'application/json', // Content type
                'CSRF-Token': csrfToken, // Include CSRF token in headers
            },
            body: JSON.stringify({
                type: type, // Log type
                email: email, // User email
                message: message, // Log message
                timestamp: new Date().toISOString(), // Timestamp
            }),
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Invalid CSRF token'); // Handle invalid CSRF token
            } else {
                throw new Error('Failed to send log'); // Handle other errors
            }
        }

        console.info('Log sent successfully'); // Log success message
    } catch (error) {
        console.error('Error sending log:', error); // Log error
    } finally {
        console.log('Completed log operation'); // Log completion
    }
}

// Function to send error log messages to the server
async function sendErrorLog(email, context) {
    const csrfToken = getCsrfToken(); // Get the CSRF token

    try {
        const response = await fetch('/log-error', {
            method: 'POST', // HTTP method
            headers: {
                'Content-Type': 'application/json', // Content type
                'CSRF-Token': csrfToken, // Include CSRF token in headers
            },
            body: JSON.stringify({
                type: 'error', // Log type
                email: email, // User email
                message: `${context}`, // Error message
                timestamp: new Date().toISOString(), // Timestamp
            }),
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Invalid CSRF token'); // Handle invalid CSRF token
            } else {
                throw new Error('Failed to send error log'); // Handle other errors
            }
        }

        console.info('Error log sent successfully'); // Log success message
    } catch (logError) {
        console.error('Error sending error log:', logError); // Log error
    } finally {
        console.log('Completed error log operation'); // Log completion
    }
}

// Error handling function
function handleError(context, error, email) {
    console.error(`${context}: ${error.message}`); // Log the error to the console
    sendErrorLog(email, `${context}: ${error.message}`).finally(() => {
        window.location.href = 'index.html'; // Redirect to index page on error
    });
}

// Function to log authentication actions
function logAuthenticationAction(email, action) {
    console.log(`Logging authentication action for ${email}: ${action}`); // Debug log
    sendLog('authentication', email, `User performed authentication action: ${action}`);
}

// Function to log transaction actions
function logTransactionAction(email, action) {
    console.log(`Logging transaction action for ${email}: ${action}`); // Debug log
    sendLog('transaction', email, `User performed transaction action: ${action}`);
}

// Function to log admin actions
function logAdminAction(email, action) {
    console.log(`Logging admin action for ${email}: ${action}`); // Debug log
    sendLog('admin', email, `Admin performed action: ${action}`);
}

// Function to log generic actions
function logAction(email, action) {
    sendLog('action', email, `User performed action: ${action}`);
}

// Main function to execute on DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
    const adminForm = document.getElementById('admin-form'); // Get admin form element
    const postsContainer = document.getElementById('posts-container'); // Get posts container element
    const adminInput = document.getElementById('admin-input'); // Get admin input element
    const charCount = document.getElementById('char-count'); // Get character count element

    // Character count update
    adminInput.addEventListener('input', () => {
        const remaining = 250 - adminInput.value.length; // Calculate remaining characters
        charCount.textContent = `${remaining} characters remaining`; // Update character count display
    });

    // Function to fetch and display posts
    function fetchAndDisplayPosts(currentUserEmail) {
        fetch('/posts')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch posts'); // Handle fetch error
                }
                return response.json(); // Parse JSON response
            })
            .then(data => {
                try {
                    const { currentUserId, posts } = data; // Destructure response data
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
                        postsContainer.appendChild(newPost); // Append new post to container
                    });
                    logAdminAction(currentUserEmail, 'Fetched and displayed posts'); // Log admin action
                } catch (error) {
                    handleError('Error processing posts data', error, currentUserEmail); // Handle error
                }
            })
            .catch(error => {
                handleError('Error fetching posts', error, currentUserEmail); // Handle fetch error
            });
    }

    // Session check
    fetch('/check-session')
        .then(response => {
            if (!response.ok) {
                throw new Error('Session check failed'); // Handle session check error
            }
            return response.json(); // Parse JSON response
        })
        .then(data => {
            try {
                if (data.error || !data.roles.includes('admin')) {
                    window.location.href = 'index.html'; // Redirect if not admin
                } else {
                    console.log('Session check data:', data); // Log session data
                    document.body.classList.remove('hidden'); // Show body content
                    const currentUserId = data.userId; // Get user ID from session check
                    const currentUserEmail = data.userEmail; // Get user email from session check
                    logAuthenticationAction(currentUserEmail, 'Session check passed'); // Log authentication action

                    adminForm.addEventListener('submit', function (event) {
                        event.preventDefault(); // Prevent default form submission

                        const tweetContent = adminInput.value.trim(); // Get trimmed tweet content
                        const price = parseFloat(document.getElementById('price-input').value.trim()); // Get and parse price
                        const quantity = parseInt(document.getElementById('quantity-input').value.trim()); // Get and parse quantity

                        if (isNaN(price) || isNaN(quantity) || price <= 0 || quantity <= 0) {
                            alert('Please enter valid numeric values for price and quantity.'); // Validate price and quantity
                            logTransactionAction(currentUserEmail, 'Invalid price or quantity entered'); // Log invalid input
                            return;
                        }

                        if (tweetContent.length > 250) {
                            alert('Tweet content must be 250 characters or less.'); // Validate tweet content length
                            logTransactionAction(currentUserEmail, 'Tweet content exceeded 250 characters'); // Log invalid content
                            return;
                        }

                        const postData = {
                            content: sanitizeInput(tweetContent), // Sanitize content
                            price: price, // Set price
                            quantity: quantity, // Set quantity
                            status: 'Available' // Set status
                        };

                        logTransactionAction(currentUserEmail, 'Sending post data: ' + JSON.stringify(postData)); // Log post data

                        fetch('/posts', {
                            method: 'POST', // HTTP method
                            headers: {
                                'Content-Type': 'application/json', // Content type
                                'CSRF-Token': getCsrfToken() // Include CSRF token in headers
                            },
                            body: JSON.stringify(postData) // Request body
                        })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Failed to create post'); // Handle create post error
                                }
                                return response.json(); // Parse JSON response
                            })
                            .then(data => {
                                if (data.error) {
                                    handleError('Error creating post', new Error(data.error), currentUserEmail); // Handle error
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
                                    postsContainer.appendChild(newPost); // Append new post

                                    adminInput.value = ''; // Reset input fields
                                    document.getElementById('price-input').value = '';
                                    document.getElementById('quantity-input').value = '';
                                    charCount.textContent = '250 characters remaining'; // Reset character count
                                    logTransactionAction(currentUserEmail, 'Post created successfully'); // Log success

                                    const statusDropdown = newPost.querySelector('.post-category');
                                    statusDropdown.disabled = false; // Enable status dropdown for the new post
                                }
                            })
                            .catch(error => {
                                handleError('Error creating post', error, currentUserEmail); // Handle error
                            });
                    });

                    // Fetch and display posts initially
                    fetchAndDisplayPosts(currentUserEmail);
                }
            } catch (error) {
                handleError('Error during session check', error, currentUserEmail); // Handle error
                window.location.href = 'index.html'; // Redirect on error
            }
        })
        .catch(error => {
            handleError('Session check failed', error, currentUserEmail); // Handle error
            window.location.href = 'index.html'; // Redirect on error
        });

    // Function to create post element
    function createPostElement(postId, content, price, quantity, status, username, currentUserId, postUserId) {
        const newPost = document.createElement('div');
        newPost.classList.add('post'); // Add 'post' class
        newPost.dataset.postId = postId; // Store post ID for future reference

        newPost.innerHTML = `
            <div class="post-header">
                <h3>${username}</h3>
                <div class="action-buttons">
                    <select title="categories" class="post-category btn bkg">
                        <option value="Available"${status === 'Available' ? ' selected' : ''}>Available</option>
                        <option value="Sold"${status === 'Sold' ? ' selected' : ''}>Sold</option>
                    </select>
                    <span class="material-icons edit-btn">edit</span>
                    <span class="material-icons delete-btn">delete</span>
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

        const statusDropdown = newPost.querySelector('.post-category');
        if (currentUserId === postUserId) {
            statusDropdown.disabled = false; // Enable for post owner
            statusDropdown.addEventListener('change', () => {
                fetch(`/update-post-status/${postId}`, {
                    method: 'PUT', // HTTP method
                    headers: {
                        'Content-Type': 'application/json', // Content type
                        'CSRF-Token': getCsrfToken(), // Include CSRF token in headers
                    },
                    body: JSON.stringify({ status: statusDropdown.value }), // Request body
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok'); // Handle error
                        }
                        return response.json(); // Parse JSON response
                    })
                    .then((data) => {
                        if (data.error) {
                            handleError('Error updating post status', new Error(data.error), currentUserEmail); // Handle error
                        } else {
                            logAdminAction(currentUserEmail, `Post status updated to ${statusDropdown.value}`); // Log success
                        }
                    })
                    .catch((error) => {
                        handleError('Error updating post status', error, currentUserEmail); // Handle error
                    });
            });
        } else {
            statusDropdown.disabled = true; // Disable for non-owners
        }

        const editButton = newPost.querySelector('.edit-btn');
        editButton.addEventListener('click', () => {
            const postText = newPost.querySelector('.post-text');
            const postPrice = newPost.querySelector('.post-price');
            const postQuantity = newPost.querySelector('.post-quantity');

            const editText = prompt('Edit the post text:', postText.textContent);
            const editPrice = prompt('Edit the price:', postPrice.textContent);
            const editQuantity = prompt('Edit the quantity:', postQuantity.textContent);

            if (editText !== null && editPrice !== null && editQuantity !== null) {
                fetch(`/posts/${postId}`, {
                    method: 'PUT', // HTTP method
                    headers: {
                        'Content-Type': 'application/json', // Content type
                        'CSRF-Token': getCsrfToken(), // Include CSRF token in headers
                    },
                    body: JSON.stringify({
                        content: editText,
                        price: editPrice,
                        quantity: editQuantity,
                        status: statusDropdown.value,
                    }), // Request body
                })
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok'); // Handle error
                        }
                        return response.json(); // Parse JSON response
                    })
                    .then((data) => {
                        if (data.error) {
                            handleError('Error editing post', new Error(data.error), currentUserEmail); // Handle error
                        } else {
                            postText.textContent = editText; // Update post text
                            postPrice.textContent = editPrice; // Update post price
                            postQuantity.textContent = editQuantity; // Update post quantity
                            logAdminAction(currentUserEmail, 'Post edited successfully'); // Log success
                        }
                    })
                    .catch((error) => {
                        handleError('Error editing post', error, currentUserEmail); // Handle error
                    });
            }
        });

        const deleteButton = newPost.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => {
            fetch(`/posts/${postId}`, {
                method: 'DELETE', // HTTP method
                headers: {
                    'CSRF-Token': getCsrfToken(), // Include CSRF token in headers
                }, // Request body
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok'); // Handle error
                    }
                    return response.json(); // Parse JSON response
                })
                .then((data) => {
                    if (data.error) {
                        handleError('Error deleting post', new Error(data.error), currentUserEmail); // Handle error
                    } else {
                        newPost.remove(); // Remove post element
                        logAdminAction(currentUserEmail, 'Post deleted successfully'); // Log success
                    }
                })
                .catch((error) => {
                    handleError('Error deleting post', error, currentUserEmail); // Handle error
                });
        });

        return newPost; // Return the new post element
    }

    // Function to sanitize input
    function sanitizeInput(input) {
        try {
            const tempDiv = document.createElement('div'); // Create a temporary div
            tempDiv.textContent = input; // Set the text content
            return tempDiv.innerHTML; // Return the sanitized HTML
        } catch (error) {
            handleError('Error sanitizing input', error); // Handle error
            return input; // Return the unsanitized input on error
        }
    }
});