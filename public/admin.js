// Function to send log messages to the server
function sendLog(type, email, message) {
    fetch('/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: type,
            email: email,
            message: message,
            timestamp: new Date().toISOString()
        })
    }).catch(error => console.error('Error sending log:', error));
}

// Log actions for authentication, transactions, and administrative actions
function logAuthenticationAction(email, action) {
    console.log(`Logging authentication action for ${email}: ${action}`); // Debug log
    sendLog('authentication', email, `User performed authentication action: ${action}`);
}

function logTransactionAction(email, action) {
    console.log(`Logging transaction action for ${email}: ${action}`); // Debug log
    sendLog('transaction', email, `User performed transaction action: ${action}`);
}

function logAdminAction(email, action) {
    console.log(`Logging admin action for ${email}: ${action}`); // Debug log
    sendLog('admin', email, `Admin performed action: ${action}`);
}

document.addEventListener("DOMContentLoaded", function() {
    const adminForm = document.getElementById('admin-form');
    const postsContainer = document.getElementById('posts-container');
    const adminInput = document.getElementById('admin-input');
    const charCount = document.getElementById('char-count');

    let currentAdminEmail = localStorage.getItem('currentUserEmail'); // Retrieve from local storage
    let currentUserId; // To store the current user ID from session check
    console.log('Current admin email:', currentAdminEmail); // Debug log

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
                logAdminAction(currentAdminEmail, 'Fetched and displayed posts');
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
                logAdminAction(currentAdminEmail, 'Error fetching posts');
            });
    }

    // Session check
    console.log('Checking session');
    fetch('/check-session')
        .then(response => response.json())
        .then(data => {
            console.log('Session check data:', data);
            if (data.error || !data.roles.includes('admin')) {
                window.location.href = 'index.html';
            } else {
                document.body.classList.remove('hidden');
                currentUserId = data.userId; // Get user ID from session check
                console.log('Current admin email after session check:', currentAdminEmail); // Debug log
                logAuthenticationAction(currentAdminEmail, 'Session check passed');

                adminForm.addEventListener('submit', function(event) {
                    event.preventDefault();

                    const tweetContent = adminInput.value.trim();
                    const price = parseFloat(document.getElementById('price-input').value.trim());
                    const quantity = parseInt(document.getElementById('quantity-input').value.trim());

                    if (isNaN(price) || isNaN(quantity) || price <= 0 || quantity <= 0) {
                        alert('Please enter valid numeric values for price and quantity.');
                        logAdminAction(currentAdminEmail, 'Invalid price or quantity entered');
                        return;
                    }

                    if (tweetContent.length > 250) {
                        alert('Tweet content must be 250 characters or less.');
                        logAdminAction(currentAdminEmail, 'Tweet content exceeded 250 characters');
                        return;
                    }

                    const postData = {
                        content: tweetContent,
                        price: price,
                        quantity: quantity,
                        status: 'Available'
                    };

                    console.log('Submitting post data:', postData); // Debug log
                    fetch('/posts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(postData)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            console.error('Error:', data.error);
                            logAdminAction(currentAdminEmail, 'Error creating post');
                        } else {
                            const newPost = createPostElement(data.postId, tweetContent, price, quantity, 'Available', data.username, currentUserId, currentUserId);
                            postsContainer.appendChild(newPost);

                            adminInput.value = '';
                            document.getElementById('price-input').value = '';
                            document.getElementById('quantity-input').value = '';
                            charCount.textContent = '250 characters remaining';
                            logAdminAction(currentAdminEmail, 'Post created successfully');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        logAdminAction(currentAdminEmail, 'Error creating post');
                    });
                });

                // Fetch and display posts initially
                fetchAndDisplayPosts(currentAdminEmail);
            }
        })
        .catch(() => {
            window.location.href = 'index.html';
            logAuthenticationAction(currentAdminEmail, 'Session check failed');
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

        // Update status logic
        const statusDropdown = newPost.querySelector('.post-category');
        if (currentUserId === postUserId) {
            statusDropdown.disabled = false; // Ensure it's enabled for the owner
            statusDropdown.addEventListener('change', () => {
                fetch(`/update-post-status/${postId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: statusDropdown.value })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error updating status:', data.error);
                        logAdminAction(currentAdminEmail, 'Error updating post status');
                    } else {
                        logAdminAction(currentAdminEmail, `Post status updated to ${statusDropdown.value}`);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    logAdminAction(currentAdminEmail, 'Error updating post status');
                });
            });
        } else {
            statusDropdown.disabled = true; // Disable the dropdown if the user is not the owner
        }

        // Edit button logic
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
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: editText,
                        price: editPrice,
                        quantity: editQuantity,
                        status: statusDropdown.value
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error:', data.error);
                        logAdminAction(currentAdminEmail, 'Error editing post');
                    } else {
                        postText.textContent = editText;
                        postPrice.textContent = editPrice;
                        postQuantity.textContent = editQuantity;
                        logAdminAction(currentAdminEmail, 'Post edited successfully');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    logAdminAction(currentAdminEmail, 'Error editing post');
                });
            }
        });

        // Delete button logic
        const deleteButton = newPost.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => {
            fetch(`/posts/${postId}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Error:', data.error);
                    logAdminAction(currentAdminEmail, 'Error deleting post');
                } else {
                    newPost.remove();
                    logAdminAction(currentAdminEmail, 'Post deleted successfully');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                logAdminAction(currentAdminEmail, 'Error deleting post');
            });
        });

        return newPost;
    }

    // Function to sanitize input
    function sanitizeInput(input) {
        const tempDiv = document.createElement('div');
        tempDiv.textContent = input;
        return tempDiv.innerHTML;
    }
});
