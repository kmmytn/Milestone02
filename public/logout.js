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

let currentUserEmail = localStorage.getItem('currentUserEmail');

// Logout button functionality
const button = document.querySelector('.logoutbtn');

button.addEventListener('click', function() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers
    xhr.onload = function() {
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
            if (xhr.responseText.includes('invalid csrf token')) {
                console.error('Invalid CSRF token during logout');
                sendLog('error', currentUserEmail, 'Invalid CSRF token detected during logout');
            }
            alert('Error logging out. Please try again.');
            logAuthenticationAction(currentUserEmail, 'Logout error');
        }
    };
    xhr.send();
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
            xhr.onload = function() {
                if (xhr.status === 200) {
                    alert('Session timed out. Please log in again.');
                    logAuthenticationAction(currentUserEmail, 'Session timed out');
                    window.location.href = 'index.html';
                } else {
                    if (xhr.responseText.includes('invalid csrf token')) {
                        console.error('Invalid CSRF token during session timeout logout');
                        sendLog('error', currentUserEmail, 'Invalid CSRF token detected during session timeout logout');
                    }
                }
            };
            xhr.send();
        }, 10000); // 10 seconds warning period
    }, 20000); // 20 seconds until warning
}

// Reset timers on any user interaction
window.onload = resetTimers;
document.onmousemove = resetTimers;
document.onkeypress = resetTimers;

// Check session timeout every 5 seconds
setInterval(function() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/check-session', true);
    xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers
    xhr.onload = function() {
        if (xhr.status === 401) {
            alert('Session timed out. Please log in again.');
            logAuthenticationAction(currentUserEmail, 'Session timed out');
            window.location.href = 'index.html';
        } else {
            if (xhr.responseText.includes('invalid csrf token')) {
                console.error('Invalid CSRF token during session check');
                sendLog('error', currentUserEmail, 'Invalid CSRF token detected during session check');
            }
        }
    };
    xhr.send();
}, 5000);
