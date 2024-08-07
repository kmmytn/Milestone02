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
          email: email,
          message: message,
          timestamp: new Date().toISOString()
        })
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
      handleError('Error sending log', error, email);
    } finally {
      console.log('Completed log operation');
    }
  }
  
  // Log actions for authentication, transactions, and administrative actions
  function logAuthenticationAction(email, action) {
    sendLog('authentication', email, `User performed authentication action: ${action}`);
  }

  function logAction(email, action) {
    sendLog('action', email, `User performed action: ${action}`);
  }

// Centralized error handling function
function handleError(context, error, email = 'system') {
    // Log to console for immediate visibility
    console.error(`${context}: ${error.message}`);
    
    // Log error using Winston to both error and combined logs
    logger.error(`${context}: ${error.message}`);

    // Send log to the server if necessary
    sendLog('error', email, `${context}: ${error.message}`);
}
  
  // Function to get the CSRF token from the cookie
  function getCsrfToken() {
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

  }
  
  
  let currentUserEmail = localStorage.getItem('currentUserEmail');
  
  // Logout button functionality
  const button = document.querySelector('.logoutbtn');
  
  button.addEventListener('click', function () {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers
  
    xhr.onload = function () {
      if (xhr.status === 200) {
        alert('Logged out successfully.');
        logAuthenticationAction(currentUserEmail, 'User logged out successfully');
  
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
          logAuthenticationAction(currentUserEmail, 'Logout error');
          handleError('Error during logout', error, currentUserEmail);
        }
      }
    };
  
    try {
      xhr.send();
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
        xhr.open('POST', '/logout', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers
  
        xhr.onload = function () {
          if (xhr.status === 200) {
            alert('Session timed out. Please log in again.');
            logAuthenticationAction(currentUserEmail, 'Session timed out');
            window.location.href = 'index.html';
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
          xhr.send();
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
    xhr.open('GET', '/check-session', true);
    xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers
  
    xhr.onload = function () {
      if (xhr.status === 401) {
        alert('Session timed out. Please log in again.');
        logAuthenticationAction(currentUserEmail, 'Session timed out');
        window.location.href = 'index.html';
      } else {
        try {
          if (xhr.responseText.includes('invalid csrf token')) {
            handleError('Invalid CSRF token during session check', new Error('Invalid CSRF token'), currentUserEmail);
          } else {
            throw new Error('Unexpected session check error');
          }
        } catch (error) {
          handleError('Error during session check', error, currentUserEmail);
        }
      }
    };
  
    try {
      xhr.send();
    } catch (error) {
      handleError('Error sending session check request', error, currentUserEmail);
    }
  }, 5000);
  