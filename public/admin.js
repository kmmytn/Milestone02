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
          'CSRF-Token': csrfToken, // Include CSRF token in headers
        },
        body: JSON.stringify({
          type: type,
          email: email,
          message: message,
          timestamp: new Date().toISOString(),
        }),
      });
  
      if (!response.ok) {
        // Handle response errors
        if (response.status === 403) {
          throw new Error('Invalid CSRF token');
        } else {
          throw new Error('Failed to send log');
        }
      }
  
      console.info('Log sent successfully');
    } catch (error) {
      console.error('Error sending log:', error);
    } finally {
      console.log('Completed log operation');
    }
  }
  
  // Error handling function
  function handleError(context, error, email = 'system') {
    // Log to console for immediate visibility
    console.error(`${context}: ${error.message}`);
  
    // Send log to the server if necessary
    sendLog('error', email, `${context}: ${error.message}`);
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
  
  function logAction(email, action) {
    sendLog('action', email, `User performed action: ${action}`);
  }
  
  document.addEventListener('DOMContentLoaded', function () {
    const adminForm = document.getElementById('admin-form');
    const postsContainer = document.getElementById('posts-container');
    const adminInput = document.getElementById('admin-input');
    const charCount = document.getElementById('char-count');
  
    // Get current admin email from localStorage or set a default
    let currentAdminEmail = localStorage.getItem('currentAdminEmail') || 'unknown@example.com';
  
    // Character count update
    adminInput.addEventListener('input', () => {
      const remaining = 250 - adminInput.value.length;
      charCount.textContent = `${remaining} characters remaining`;
    });
  
    // Function to fetch and display posts
    function fetchAndDisplayPosts() {
      fetch('/posts')
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then((data) => {
          const { currentUserId, posts } = data;
          postsContainer.innerHTML = ''; // Clear existing posts
          posts.forEach((post) => {
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
          logAdminAction(currentAdminEmail, 'Fetched and displayed posts');
        })
        .catch((error) => {
          handleError('Error fetching posts', error, currentAdminEmail);
        });
    }
  
    // Session check
    console.log('Checking session');
    fetch('/check-session')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        if (data.error || !data.roles.includes('admin')) {
          window.location.href = 'index.html';
        } else {
          document.body.classList.remove('hidden');
          const currentUserId = data.userId; // Get user ID from session check
          currentAdminEmail = data.email; // Get admin email from response
          logAuthenticationAction(currentAdminEmail, 'Session check passed');
  
          adminForm.addEventListener('submit', function (event) {
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
              content: sanitizeInput(tweetContent),
              price: price,
              quantity: quantity,
              status: 'Available',
            };
  
            console.log('Submitting post data:', postData); // Debug log
            fetch('/posts', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': getCsrfToken(), // Include CSRF token in headers
              },
              body: JSON.stringify(postData),
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                return response.json();
              })
              .then((data) => {
                if (data.error) {
                  handleError('Error creating post', new Error(data.error), currentAdminEmail);
                } else {
                  const newPost = createPostElement(
                    data.postId,
                    tweetContent,
                    price,
                    quantity,
                    'Available',
                    data.username,
                    currentUserId,
                    currentUserId
                  );
                  postsContainer.appendChild(newPost);
  
                  adminInput.value = '';
                  document.getElementById('price-input').value = '';
                  document.getElementById('quantity-input').value = '';
                  charCount.textContent = '250 characters remaining';
                  logAdminAction(currentAdminEmail, 'Post created successfully');
                }
              })
              .catch((error) => {
                handleError('Error creating post', error, currentAdminEmail);
              });
          });
  
          // Fetch and display posts initially
          fetchAndDisplayPosts();
        }
      })
      .catch((error) => {
        handleError('Session check failed', error, currentAdminEmail);
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
                handleError('Error updating post status', new Error(data.error), currentAdminEmail);
              } else {
                logAdminAction(currentAdminEmail, `Post status updated to ${statusDropdown.value}`);
              }
            })
            .catch((error) => {
              handleError('Error updating post status', error, currentAdminEmail);
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
              'Content-Type': 'application/json',
              'CSRF-Token': getCsrfToken(), // Include CSRF token in headers
            },
            body: JSON.stringify({
              content: editText,
              price: editPrice,
              quantity: editQuantity,
              status: statusDropdown.value,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.json();
            })
            .then((data) => {
              if (data.error) {
                handleError('Error editing post', new Error(data.error), currentAdminEmail);
              } else {
                postText.textContent = editText;
                postPrice.textContent = editPrice;
                postQuantity.textContent = editQuantity;
                logAdminAction(currentAdminEmail, 'Post edited successfully');
              }
            })
            .catch((error) => {
              handleError('Error editing post', error, currentAdminEmail);
            });
        }
      });
  
      // Delete button logic
      const deleteButton = newPost.querySelector('.delete-btn');
      deleteButton.addEventListener('click', () => {
        fetch(`/posts/${postId}`, {
          method: 'DELETE',
          headers: {
            'CSRF-Token': getCsrfToken(), // Include CSRF token in headers
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then((data) => {
            if (data.error) {
              handleError('Error deleting post', new Error(data.error), currentAdminEmail);
            } else {
              newPost.remove();
              logAdminAction(currentAdminEmail, 'Post deleted successfully');
            }
          })
          .catch((error) => {
            handleError('Error deleting post', error, currentAdminEmail);
          });
      });
  
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
  