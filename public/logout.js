// Function to send log messages to the server
async function sendLog(type, email, message) {
  const csrfToken = getCsrfToken(); // Get the CSRF token

  try {
      const response = await fetch('/log', {
          method: 'POST', // HTTP method
          headers: {
              'Content-Type': 'application/json', // Content type
              'CSRF-Token': csrfToken // Include CSRF token in headers
          },
          body: JSON.stringify({
              type: type, // Log type
              email: email, // User email
              message: message, // Log message
              timestamp: new Date().toISOString() // Timestamp
          })
      });

      if (!response.ok) {
          // Handle response errors
          if (response.status === 403) {
              throw new Error('Invalid CSRF token'); // Handle invalid CSRF token
          } else {
              throw new Error('Failed to send log'); // Handle other errors
          }
      }

      console.info('Log sent successfully'); // Log success message
  } catch (error) {
      handleError('Error sending log', error, email); // Handle error
  } finally {
      console.log('Completed log operation'); // Log completion
  }
}

// Centralized error handling function
function handleError(context, error, email) {
  // Log to console for immediate visibility
  console.error(`${context}: ${error.message}`);

  // Send log to the server if necessary
  sendErrorLog(email, `${context}: ${error.message}`).finally(() => {
      // Force logout and redirect to index page
      window.location.href = 'index.html';
  });
}

// Function to send error log messages to the server
async function sendErrorLog(email, message) {
  const csrfToken = getCsrfToken(); // Get the CSRF token

  try {
      const response = await fetch('/log-error', {
          method: 'POST', // HTTP method
          headers: {
              'Content-Type': 'application/json', // Content type
              'CSRF-Token': csrfToken // Include CSRF token in headers
          },
          body: JSON.stringify({
              type: 'error', // Log type
              email: email, // User email
              message: message, // Error message
              timestamp: new Date().toISOString() // Timestamp
          })
      });

      if (!response.ok) {
          throw new Error('Failed to send error log'); // Handle response errors
      }

      console.info('Error log sent successfully'); // Log success message
  } catch (logError) {
      console.error('Error sending error log:', logError.message); // Log error
      // In DEBUG_MODE, log the stack trace as well
      if (DEBUG_MODE) {
          console.error(logError.stack);
      }
  } finally {
      console.log('Completed error log operation'); // Log completion
  }
}

// Function to log authentication actions
function logAuthenticationAction(email, action) {
  sendLog('authentication', email, `User performed authentication action: ${action}`);
}

// Function to log generic actions
function logAction(email, action) {
  sendLog('action', email, `User performed action: ${action}`);
}

// Function to get the CSRF token from the cookie
function getCsrfToken() {
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
}

let currentUserEmail = localStorage.getItem('currentUserEmail'); // Get the current user's email from localStorage

// Logout button functionality
const button = document.querySelector('.logoutbtn'); // Get the logout button element

button.addEventListener('click', function () {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/logout', true); // Open a POST request to the logout endpoint
  xhr.setRequestHeader('Content-Type', 'application/json'); // Set the Content-Type header
  xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers

  xhr.onload = function () {
      if (xhr.status === 200) {
          alert('Logged out successfully.');
          logAuthenticationAction(currentUserEmail, 'User logged out successfully'); // Log the logout action

          // Clear browser cache
          if ('caches' in window) {
              caches.keys().then((names) => {
                  names.forEach((name) => {
                      caches.delete(name);
                  });
              });
          }

          // Clear local storage
          localStorage.clear();

          // Manipulate history to prevent back navigation to authenticated pages
          history.replaceState(null, null, 'index.html'); // Replace current history entry with login page

          window.location.href = 'index.html'; // Redirect to login page
      } else {
          try {
              if (xhr.responseText.includes('invalid csrf token')) {
                  handleError('Invalid CSRF token during logout', new Error('Invalid CSRF token'), currentUserEmail);
              } else {
                  throw new Error('Unexpected logout error');
              }
          } catch (error) {
              alert('Error logging out. Please try again.');
              logAuthenticationAction(currentUserEmail, 'Logout error'); // Log the error
              handleError('Error during logout', error, currentUserEmail);
          }
      }
  };

  try {
      xhr.send(); // Send the logout request
  } catch (error) {
      handleError('Error sending logout request', error, currentUserEmail);
  }
});

// Check session timeout
let warningTimeout;
let logoutTimeout;

function resetTimers() {
  clearTimeout(warningTimeout);
  clearTimeout(logoutTimeout);

  warningTimeout = setTimeout(() => {
      alert('You will be logged out in 10 seconds due to inactivity.');

      logoutTimeout = setTimeout(() => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/logout', true); // Open a POST request to the logout endpoint
          xhr.setRequestHeader('Content-Type', 'application/json'); // Set the Content-Type header
          xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers

          xhr.onload = function () {
              if (xhr.status === 200) {
                  alert('Session timed out. Please log in again.');
                  logAuthenticationAction(currentUserEmail, 'Session timed out'); // Log the session timeout
                  window.location.href = 'index.html'; // Redirect to login page
              } else {
                  try {
                      if (xhr.responseText.includes('invalid csrf token')) {
                          handleError('Invalid CSRF token during session timeout logout', new Error('Invalid CSRF token'), currentUserEmail);
                      } else {
                          throw new Error('Unexpected session timeout error');
                      }
                  } catch (error) {
                      handleError('Error during session timeout', error, currentUserEmail);
                  }
              }
          };

          try {
              xhr.send(); // Send the logout request
          } catch (error) {
              handleError('Error sending session timeout request', error, currentUserEmail);
          }
      }, 10000); // 10 seconds warning period
  }, 20000); // 20 seconds until warning
}

// Reset timers on any user interaction
window.onload = resetTimers;
document.onmousemove = resetTimers;
document.onkeypress = resetTimers;

// Check session timeout every 5 seconds
setInterval(function () {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '/check-session', true); // Open a GET request to check session endpoint
  xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers

  xhr.onload = function () {
      if (xhr.status === 401) {
          alert('Session timed out. Please log in again.');
          logAuthenticationAction(currentUserEmail, 'Session timed out'); // Log the session timeout
          window.location.href = 'index.html'; // Redirect to login page
      } else {
          try {
              if (xhr.responseText.includes('invalid csrf token')) {
                  handleError('Invalid CSRF token during session check', new Error('Invalid CSRF token'), currentUserEmail);
              }
          } catch (error) {
              handleError('Error during session check', error, currentUserEmail);
          }
      }
  };

  try {
      xhr.send(); // Send the session check request
  } catch (error) {
      handleError('Error sending session check request', error, currentUserEmail);
  }
}, 5000); // Check session timeout every 5 seconds