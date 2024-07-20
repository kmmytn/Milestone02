let currentUserEmail = null; // Global variable to store current user email

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
    sendLog('authentication', email, `User performed authentication action: ${action}`);
}

// Logout button functionality
const button = document.querySelector('.logoutbtn');

button.addEventListener('click', function() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
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
            xhr.onload = function() {
                if (xhr.status === 200) {
                    alert('Session timed out. Please log in again.');
                    logAuthenticationAction(currentUserEmail, 'Session timed out');
                    window.location.href = 'index.html';
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
    xhr.onload = function() {
        if (xhr.status === 401) {
            alert('Session timed out. Please log in again.');
            logAuthenticationAction(currentUserEmail, 'Session timed out');
            window.location.href = 'index.html';
        }
    };
    xhr.send();
}, 5000);
