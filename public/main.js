const container = document.querySelector('.container');
const btnSignIn = document.querySelector('.btnSign-in');
const btnSignUp = document.querySelector('.btnSign-up');

btnSignIn.addEventListener('click', () => {
    container.classList.add('active');
});

btnSignUp.addEventListener('click', () => {
    container.classList.remove('active');
});

document.addEventListener('DOMContentLoaded', function() {
    const imgError = document.getElementById('img-error');
    const fileLabel = document.querySelector('.custom-file-label');

    document.getElementById('pfp').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const fileType = file.type;

            // Function to check file signature
            const checkFileSignature = (file, callback) => {
                const reader = new FileReader();
                reader.onloadend = function(e) {
                    const arr = (new Uint8Array(e.target.result)).subarray(0, 4);
                    let header = '';
                    for (let i = 0; i < arr.length; i++) {
                        header += arr[i].toString(16);
                    }
                    let isValid = false;
                    switch (header) {
                        case '89504e47':
                            isValid = 'image/png';
                            break;
                        case 'ffd8ffe0':
                        case 'ffd8ffe1':
                        case 'ffd8ffe2':
                            isValid = 'image/jpeg';
                            break;
                        default:
                            isValid = false; // Or you can set a default invalid value
                            break;
                    }
                    callback(isValid);
                };
                reader.readAsArrayBuffer(file);
            };

            checkFileSignature(file, (isValid) => {
                if (!isValid) {
                    imgError.textContent = 'Invalid file type. Only JPEG/PNG images allowed.';
                    imgError.classList.add('visible');
                    e.target.value = ''; // Clear the selection
                } else {
                    imgError.textContent = '';
                    imgError.classList.remove('visible');
                    const fileName = file.name || 'Choose Profile Photo';
                    fileLabel.textContent = fileName;
                }
            });
        } else {
            fileLabel.textContent = 'Choose Profile Photo';
        }
    });
});

document.getElementById('form_signup').addEventListener('submit', function(e) {
    e.preventDefault();

    // Initialize references to error message elements
    const phoneError = document.getElementById('phone-error');
    const emailError = document.getElementById('email-error');
    const passError = document.getElementById('pass-error');

    // Phone number validation
    const phoneNumber = document.getElementById('phone').value;
    const isValidInternational = /^\+\d{1,3}\s?\(\d{1,3}\)\s?\d{1,3}-\d{1,4}$/.test(phoneNumber);
    const isValidPhilippine = /^(09|\+639)\d{9}$/.test(phoneNumber);
    if (!isValidInternational && !isValidPhilippine) {
        phoneError.textContent = 'Please enter a valid phone number.';
        phoneError.classList.add('visible');
    } else {
        phoneError.textContent = '';
        phoneError.classList.remove('visible');
    }

    // Email validation
    const isValidEmail = (email) => {
        const atSymbolIndex = email.indexOf('@');
        if (atSymbolIndex === -1) return false;

        const localPart = email.slice(0, atSymbolIndex);
        const domainPart = email.slice(atSymbolIndex + 1);

        return localPart.length <= 64 && domainPart.length <= 255;
    };

    const emailSignup = document.getElementById('emailsignup').value;
    if (!isValidEmail(emailSignup)) {
        emailError.textContent = 'Please enter a valid email address.';
        emailError.classList.add('visible');
    } else {
        emailError.textContent = '';
        emailError.classList.remove('visible');
    }

    // Password confirmation validation
    const password = document.getElementById('passwordsignup').value.trim();
    const confirmPassword = document.getElementById('confirmpassword').value.trim();
    const isValidPassword = password === confirmPassword;

    // New regex pattern for password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W]).{12,64}$/;

    if (!passwordRegex.test(password)) {
        passError.textContent = 'Password must include uppercase, lowercase letters, digits, special characters, and be 12-64 characters long.';
        passError.classList.add('visible');
    } else if (!isValidPassword) {
        passError.textContent = 'Passwords do not match.';
        passError.classList.add('visible');
    } else {
        passError.textContent = '';
        passError.classList.remove('visible');
    }

    // Determine if form submission should proceed
    const shouldSubmit = !phoneError.textContent && !emailError.textContent && !passError.textContent;
    if (shouldSubmit) {
        // Proceed with form submission
        const formData = new FormData(this);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/signup', true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                alert(xhr.responseText);
                location.reload();
            } else {
                alert('An error occurred during signup.');
            }
        };
        xhr.send(formData);
    } else {
        // Prevent form submission if there are errors
        return false;
    }
});

document.getElementById('form_login').addEventListener('submit', function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');

    if (!email || !password) {
        loginError.textContent = "Please enter both email and password";
        loginError.classList.add('visible');
        return;
    }

    const loginData = { email, password };
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/login', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status === 200) {
            // localStorage.setItem('sessionId', response.sessionId); // Store the session ID
            alert('Logged in successfully.');
            
            if (response.roles.includes('admin')) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'user.html';
            }
        } else {
            loginError.textContent = response.error || 'An error occurred. Please try again.';
            loginError.classList.add('visible');
        }
    };
    xhr.send(JSON.stringify(loginData));
});