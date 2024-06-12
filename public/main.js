const container = document.querySelector('.container')
const btnSignIn = document.querySelector('.btnSign-in')
const btnSignUp = document.querySelector('.btnSign-up')

btnSignIn.addEventListener('click', () => {
    container.classList.add('active')
})

btnSignUp.addEventListener('click', () => {
    container.classList.remove('active')
})

const profilePhotoInput = document.getElementById('pfp');
const customFileLabel = document.querySelector('.custom-file-label');

profilePhotoInput.addEventListener('change', () => {
    const fileName = profilePhotoInput.files[0]?.name || 'Choose Profile Photo';
    customFileLabel.textContent = fileName;
});

document.getElementById('form_signup').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the form from submitting normally

    const phoneNumber = document.getElementById('phone').value;
    const phoneError = document.getElementById('phone-error'); // Get the error message span
    
    // Clear any previous error messages
    phoneError.textContent = '';

    // First, check against the general international pattern
    const isValidInternational = /^\+\d{1,3}\s?\(\d{1,3}\)\s?\d{1,3}-\d{1,4}$/.test(phoneNumber);
    const isValidPhilippine = /^(09|\+639)\d{9}$/.test(phoneNumber);
    console.log(isValidPhilippine);
    if (!isValidInternational && !isValidPhilippine) {
        phoneError.textContent = 'Please enter a valid phone number.';
        phoneError.classList.add('visible');
        return false; // Stop the submission process
    }

    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmpassword').value.trim();
    const passError = document.getElementById('pass-error');

    passError.textContent = '';

    if (password!== confirmPassword) {
        passError.textContent = 'Passwords do not match.';
        passError.classList.add('visible');
        return false; // Stop the submission process
    }
    
    

    // If the phone number is valid, proceed with form submission
    const formData = new FormData(this); // Get form data
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/signup', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert(xhr.responseText); // Show success message
            location.reload(); // Reload the page
        } else {
            alert('An error occurred during signup.');
        }
    };
    xhr.send(formData);
});

document.getElementById('form_login').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');

    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    const loginData = { email, password };
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/login', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.sessionId) {
                localStorage.setItem('sessionId', response.sessionId); // Store the session ID
                alert('Logged in successfully.');
                // Redirect based on role
                if (response.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            } else {
                alert('Login failed. Please try again.');
            }
        } else {
            alert('Invalid email or password.');
            loginError.textContent = 'User or Password does not match.';
            loginError.classList.add('visible');
        }
    };
    xhr.send(JSON.stringify(loginData));
});