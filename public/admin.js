document.addEventListener("DOMContentLoaded", function() {
    const adminForm = document.getElementById('admin-form');
    const postsContainer = document.getElementById('posts-container');
    let username = '';

    // Fetch user info to get the username
    fetch('/user-info')
        .then(response => response.json())
        .then(user => {
            username = user.username;

            adminForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const tweetContent = document.getElementById('admin-input').value;
                const price = document.getElementById('price-input').value;
                const quantity = document.getElementById('quantity-input').value;

                const feedErrorMessage = document.querySelector('.feed-error-message');
                feedErrorMessage.classList.remove('visible');

                if (price.length < 3) {
                    feedErrorMessage.textContent = "Please input more than 2 numeric characters";
                    feedErrorMessage.classList.add('visible');
                    return;
                }

                const postData = {
                    content: tweetContent,
                    price: price,
                    quantity: quantity,
                    status: 'Available'
                };

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
                    } else {
                        const newPost = createPostElement(data.postId, tweetContent, price, quantity, 'Available', username);
                        postsContainer.appendChild(newPost);

                        document.getElementById('admin-input').value = '';
                        document.getElementById('price-input').value = '';
                        document.getElementById('quantity-input').value = '';
                    }
                })
                .catch(error => console.error('Error:', error));
            });

            fetch('/posts')
                .then(response => response.json())
                .then(data => {
                    data.forEach(post => {
                        const newPost = createPostElement(post.id, post.content, post.price, post.quantity, post.status, username);
                        postsContainer.appendChild(newPost);
                    });
                })
                .catch(error => console.error('Error:', error));
        })
        .catch(error => console.error('Error fetching user info:', error));

    function createPostElement(postId, content, price, quantity, status, username) {
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
                        status: newPost.querySelector('.post-category').value
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error:', data.error);
                    } else {
                        postText.textContent = editText;
                        postPrice.textContent = editPrice;
                        postQuantity.textContent = editQuantity;
                    }
                })
                .catch(error => console.error('Error:', error));
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
                } else {
                    newPost.remove();
                }
            })
            .catch(error => console.error('Error:', error));
        });

        return newPost;
    }

    fetch('/check-session')
        .then(response => response.json())
        .then(data => {
            if (data.error || !data.roles.includes('admin')) {
                window.location.href = 'index.html';
            } else {
                document.getElementById('content').style.display = 'block';
            }
        })
        .catch(() => {
            window.location.href = 'index.html';
        });

});