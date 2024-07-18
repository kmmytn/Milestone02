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

        return newPost;
    }
});