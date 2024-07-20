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

function logTransactionAction(email, action) {
    sendLog('transaction', email, `User performed transaction action: ${action}`);
}

function logAdminAction(email, action) {
    sendLog('admin', email, `Admin performed action: ${action}`);
}


const container = document.querySelector('.container');
    const btnSignIn = document.querySelector('.btnSign-in');
    const btnSignUp = document.querySelector('.btnSign-up');

    btnSignIn.addEventListener('click', () => {
        container.classList.add('active');
        console.log('User clicked Sign In:', currentUserEmail); // Debug log
        logAuthenticationAction(currentUserEmail, 'User clicked Sign In');
    });

    btnSignUp.addEventListener('click', () => {
        container.classList.remove('active');
        console.log('User clicked Sign Up:', currentUserEmail); // Debug log
        logAuthenticationAction(currentUserEmail, 'User clicked Sign Up');
    });

    const imgError = document.getElementById('img-error');
    const fileLabel = document.querySelector('.custom-file-label');

    document.getElementById('pfp').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const fileType = file.type;

            // Basic MIME type check
            if (fileType !== 'image/jpeg' && fileType !== 'image/png') {
                imgError.textContent = 'Invalid file type. Only JPEG/PNG images allowed.';
                imgError.classList.add('visible');
                e.target.value = ''; // Clear the selection
                console.log('Invalid file type uploaded:', currentUserEmail); // Debug log
                logTransactionAction(currentUserEmail, 'Invalid file type uploaded');
            } else {
                imgError.textContent = '';
                imgError.classList.remove('visible');
                const fileName = file.name || 'Choose Profile Photo';
                fileLabel.textContent = fileName;
                console.log('Valid file uploaded:', currentUserEmail); // Debug log
                logTransactionAction(currentUserEmail, 'Valid file uploaded');
            }
        } else {
            fileLabel.textContent = 'Choose Profile Photo';
        }
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
                    currentUserEmail = emailSignup; // Store the email of the signed up user
                    console.log('User signed up with email:', currentUserEmail); // Debug log
                    logAuthenticationAction(currentUserEmail, 'User signed up successfully');
                    localStorage.setItem('currentUserEmail', currentUserEmail); // Save to local storage
                    location.reload();
                } else {
                    alert('An error occurred during signup.');
                    logAuthenticationAction(currentUserEmail, 'Signup error');
                }
            };
            xhr.send(formData);
        } else {
            // Prevent form submission if there are errors
            logAuthenticationAction(currentUserEmail, 'Signup validation failed');
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
            logAuthenticationAction(currentUserEmail, 'Login failed: missing credentials');
            return;
        }

        const loginData = { email, password };
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/login', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status === 200) {
                alert('Logged in successfully.');
                currentUserEmail = email; // Store the email of the logged in user
                console.log('User logged in with email:', currentUserEmail); // Debug log
                logAuthenticationAction(currentUserEmail, 'User logged in successfully');
                localStorage.setItem('currentUserEmail', currentUserEmail); // Save to local storage
                // CLEAR OUT FIELDS HERE
                document.getElementById('email').value = '';
                document.getElementById('password').value = '';

                if (response.roles.includes('admin')) {
                    logAdminAction(currentUserEmail, 'Admin logged in');
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'user.html';
                }
            } else {
                loginError.textContent = response.error || 'An error occurred. Please try again.';
                loginError.classList.add('visible');
                logAuthenticationAction(currentUserEmail, 'Login error: ' + (response.error || 'Unknown error'));
            }
        };
        xhr.send(JSON.stringify(loginData));
    });

