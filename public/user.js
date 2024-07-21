// Function to get the CSRF token from the cookie
function getCsrfToken() {
    const name = 'XSRF-TOKEN=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// Function to send log messages to the server
function sendLog(type, email, message) {
    const csrfToken = getCsrfToken();
    fetch('/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'CSRF-Token': csrfToken // Include CSRF token in headers
        },
        body: JSON.stringify({
            type: type,
            email: email,
            message: message,
            timestamp: new Date().toISOString()
        })
    }).catch(error => {
        if (error.message.includes('invalid csrf token')) {
            console.error('Invalid CSRF token:', error);
            sendLog('error', email, 'Invalid CSRF token detected');
        } else {
            console.error('Error sending log:', error);
        }
    });
}

// Log actions for authentication, transactions, and administrative actions
function logAuthenticationAction(email, action) {
    sendLog('authentication', email, `User performed authentication action: ${action}`);
}

function logTransactionAction(email, action) {
    sendLog('transaction', email, `User performed transaction action: ${action}`);
}

document.addEventListener("DOMContentLoaded", function() {
    const adminForm = document.getElementById('admin-form');
    const postsContainer = document.getElementById('posts-container');
    const adminInput = document.getElementById('admin-input');
    const charCount = document.getElementById('char-count');

    //let currentUserEmail = localStorage.getItem('currentUserEmail'); // Retrieve from local storage

    // Character count update
    adminInput.addEventListener('input', () => {
        const remaining = 250 - adminInput.value.length;
        charCount.textContent = `${remaining} characters remaining`;
    });

    // Function to fetch and display posts
    function fetchAndDisplayPosts() {
        fetch('/posts')
            .then(response => response.json())
            .then(data => {
                const { currentUserId, posts } = data;
                postsContainer.innerHTML = ''; // Clear existing posts
                posts.forEach(post => {
                    const newPost = createPostElement(post.id, sanitizeInput(post.content), post.price, post.quantity, post.status, sanitizeInput(post.username), currentUserId, post.user_id);
                    postsContainer.appendChild(newPost);
                });
                logTransactionAction(currentUserEmail, 'Fetched and displayed posts');
            })
            .catch(error => {
                if (error.message.includes('invalid csrf token')) {
                    console.error('Invalid CSRF token:', error);
                    sendLog('error', currentUserEmail, 'Invalid CSRF token detected during fetching posts');
                } else {
                    console.error('Error fetching posts:', error);
                    logTransactionAction(currentUserEmail, 'Error fetching posts');
                }
            });
    }

    // Session check
    fetch('/check-session')
        .then(response => response.json())
        .then(data => {
            if (data.error || !data.roles.includes('user')) {
                window.location.href = 'index.html';
            } else {
                document.body.classList.remove('hidden');
                const currentUserId = data.userId; // Get user ID from session check
                const currentUserEmail = data.email; // Get admin email from response
                logAuthenticationAction(currentUserEmail, 'Session check passed');


                adminForm.addEventListener('submit', function(event) {
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
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            console.error('Error:', data.error);
                            logTransactionAction(currentUserEmail, 'Error creating post');
                        } else {
                            const newPost = createPostElement(data.postId, sanitizeInput(tweetContent), price, quantity, 'Available', sanitizeInput(data.username), currentUserId, data.userId);
                            postsContainer.appendChild(newPost);

                            adminInput.value = '';
                            document.getElementById('price-input').value = '';
                            document.getElementById('quantity-input').value = '';
                            charCount.textContent = '250 characters remaining';
                            logTransactionAction(currentUserEmail, 'Post created successfully');
                        }
                    })
                    .catch(error => {
                        if (error.message.includes('invalid csrf token')) {
                            console.error('Invalid CSRF token:', error);
                            sendLog('error', currentUserEmail, 'Invalid CSRF token detected during creating post');
                        } else {
                            console.error('Error:', error);
                            logTransactionAction(currentUserEmail, 'Error creating post');
                        }
                    });
                });

                // Fetch and display posts initially
                fetchAndDisplayPosts();
            }
        })
        .catch(error => {
            if (error.message.includes('invalid csrf token')) {
                console.error('Invalid CSRF token:', error);
                sendLog('error', currentUserEmail, 'Invalid CSRF token detected during session check');
            } else {
                window.location.href = 'index.html';
                logAuthenticationAction(currentUserEmail, 'Session check failed');
            }
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
                        'CSRF-Token': getCsrfToken() // Include CSRF token in headers
                    },
                    body: JSON.stringify({ status: statusDropdown.value })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error updating status:', data.error);
                        logTransactionAction(currentUserEmail, 'Error updating post status');
                    } else {
                        logTransactionAction(currentUserEmail, `Post status updated to ${statusDropdown.value}`);
                    }
                })
                .catch(error => {
                    if (error.message.includes('invalid csrf token')) {
                        console.error('Invalid CSRF token:', error);
                        sendLog('error', currentUserEmail, 'Invalid CSRF token detected during updating post status');
                    } else {
                        console.error('Error:', error);
                        logTransactionAction(currentUserEmail, 'Error updating post status');
                    }
                });
            });
        } else {
            statusDropdown.disabled = true; // Disable the dropdown if the user is not the owner
        }

        return newPost;
    }

    // Function to sanitize input
    function sanitizeInput(input) {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = input;
        return tempDiv.innerHTML;
    }
});
