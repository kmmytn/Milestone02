const button = document.querySelector('.logoutbtn');

button.addEventListener('click', function() {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/logout', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert('Logged out successfully.');
            window.location.href = 'index.html'; // Redirect to login page
        } else {
            alert('Error logging out. Please try again.');
        }
    };
    xhr.send();
});
