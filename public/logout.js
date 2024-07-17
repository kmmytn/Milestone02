const button = document.querySelector('.logoutbtn');

button.addEventListener('click', function() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert('Logged out successfully.');

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
            window.location.href = 'index.html';
        }
    };
    xhr.send();
}, 5000);
