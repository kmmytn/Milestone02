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

// Function to send error log messages to the server
async function sendErrorLog(email, context) {
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
              message: `${context}`, // Error message
              timestamp: new Date().toISOString() // Timestamp
          })
      });

      if (!response.ok) {
          // Handle response errors
          if (response.status === 403) {
              throw new Error('Invalid CSRF token'); // Handle invalid CSRF token
          } else {
              throw new Error('Failed to send error log'); // Handle other errors
          }
      }

      console.info('Error log sent successfully'); // Log success message
  } catch (logError) {
      console.error('Error sending error log:', logError); // Log error
  } finally {
      console.log('Completed error log operation'); // Log completion
  }
}

// Function to log authentication actions
function logAuthenticationAction(email, action) {
  console.log(`Logging authentication action for ${email}: ${action}`); // Debug log
  sendLog('authentication', email, `User performed authentication action: ${action}`);
}

// Function to log transaction actions
function logTransactionAction(email, action) {
  console.log(`Logging transaction action for ${email}: ${action}`); // Debug log
  sendLog('transaction', email, `User performed transaction action: ${action}`);
}

// Function to log admin actions
function logAdminAction(email, action) {
  console.log(`Logging admin action for ${email}: ${action}`); // Debug log
  sendLog('admin', email, `Admin performed action: ${action}`);
}

// Function to log generic actions
function logAction(email, action) {
  sendLog('action', email, `User performed action: ${action}`);
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

const container = document.querySelector('.container'); // Get the container element
const btnSignIn = document.querySelector('.btnSign-in'); // Get the Sign In button element
const btnSignUp = document.querySelector('.btnSign-up'); // Get the Sign Up button element

btnSignIn.addEventListener('click', () => {
  try {
      container.classList.add('active'); // Add 'active' class to the container
      console.log('User clicked Sign In:', currentUserEmail); // Debug log
      logAuthenticationAction(currentUserEmail, 'User clicked Sign In'); // Log the action
  } catch (error) {
      handleError('Error during Sign In button click', error, currentUserEmail); // Handle error
  }
});

btnSignUp.addEventListener('click', () => {
  try {
      container.classList.remove('active'); // Remove 'active' class from the container
      console.log('User clicked Sign Up:', currentUserEmail); // Debug log
      logAuthenticationAction(currentUserEmail, 'User clicked Sign Up'); // Log the action
  } catch (error) {
      handleError('Error during Sign Up button click', error, currentUserEmail); // Handle error
  }
});

const imgError = document.getElementById('img-error'); // Get the image error element
const fileLabel = document.querySelector('.custom-file-label'); // Get the custom file label element

document.getElementById('pfp').addEventListener('change', function (e) {
  try {
      const file = e.target.files[0]; // Get the selected file
      if (file) {
          const fileType = file.type;

          // Basic MIME type check
          if (fileType !== 'image/jpeg' && fileType !== 'image/png') {
              imgError.textContent = 'Invalid file type. Only JPEG/PNG images allowed.'; // Set error message
              imgError.classList.add('visible'); // Show error message
              e.target.value = ''; // Clear the selection
              console.log('Invalid file type uploaded:', currentUserEmail); // Debug log
              logTransactionAction(currentUserEmail, 'Invalid file type uploaded'); // Log the action
          } else {
              imgError.textContent = ''; // Clear error message
              imgError.classList.remove('visible'); // Hide error message
              const fileName = file.name || 'Choose Profile Photo'; // Get file name
              fileLabel.textContent = fileName; // Update file label
              console.log('Valid file uploaded:', currentUserEmail); // Debug log
              logTransactionAction(currentUserEmail, 'Valid file uploaded'); // Log the action
          }
      } else {
          fileLabel.textContent = 'Choose Profile Photo'; // Default file label text
      }
  } catch (error) {
      handleError('Error during file selection', error, currentUserEmail); // Handle error
  }
});

document.getElementById('form_signup').addEventListener('submit', function (e) {
  e.preventDefault(); // Prevent default form submission

  try {
      // Initialize references to error message elements
      const phoneError = document.getElementById('phone-error');
      const emailError = document.getElementById('email-error');
      const passError = document.getElementById('pass-error');

      // Phone number validation
      const phoneNumber = document.getElementById('phone').value;
      const isValidInternational = /^\+\d{1,3}\s?\(\d{1,3}\)\s?\d{1,3}-\d{1,4}$/.test(phoneNumber);
      const isValidPhilippine = /^(09|\+639)\d{9}$/.test(phoneNumber);
      if (!isValidInternational && !isValidPhilippine) {
          phoneError.textContent = 'Please enter a valid phone number.'; // Set error message
          phoneError.classList.add('visible'); // Show error message
      } else {
          phoneError.textContent = ''; // Clear error message
          phoneError.classList.remove('visible'); // Hide error message
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
          emailError.textContent = 'Please enter a valid email address.'; // Set error message
          emailError.classList.add('visible'); // Show error message
      } else {
          emailError.textContent = ''; // Clear error message
          emailError.classList.remove('visible'); // Hide error message
      }

      // Password confirmation validation
      const password = document.getElementById('passwordsignup').value.trim();
      const confirmPassword = document.getElementById('confirmpassword').value.trim();
      const isValidPassword = password === confirmPassword;

      // New regex pattern for password validation
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W]).{12,64}$/;

      if (!passwordRegex.test(password)) {
          passError.textContent = 'Password must include uppercase, lowercase letters, digits, special characters, and be 12-64 characters long.'; // Set error message
          passError.classList.add('visible'); // Show error message
      } else if (!isValidPassword) {
          passError.textContent = 'Passwords do not match.'; // Set error message
          passError.classList.add('visible'); // Show error message
      } else {
          passError.textContent = ''; // Clear error message
          passError.classList.remove('visible'); // Hide error message
      }

      // Determine if form submission should proceed
      const shouldSubmit = !phoneError.textContent && !emailError.textContent && !passError.textContent;
      if (shouldSubmit) {
          // Proceed with form submission
          const formData = new FormData(this);
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/signup', true);
          xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers
          xhr.onload = function () {
              if (xhr.status === 200) {
                  alert(xhr.responseText); // Show response message
                  currentUserEmail = emailSignup; // Store the email of the signed-up user
                  console.log('User signed up with email:', currentUserEmail); // Debug log
                  logAuthenticationAction(currentUserEmail, 'User signed up successfully'); // Log the action
                  localStorage.setItem('currentUserEmail', currentUserEmail); // Save to local storage
                  location.reload(); // Reload the page
              } else {
                  try {
                      if (xhr.responseText.includes('invalid csrf token')) {
                          handleError('Invalid CSRF token during signup', new Error('Invalid CSRF token'), currentUserEmail);
                      } else {
                          throw new Error('Unexpected signup error');
                      }
                  } catch (error) {
                      alert('An error occurred during signup.'); // Show error message
                      logAuthenticationAction(currentUserEmail, 'Signup error'); // Log the error
                      handleError('Error during signup', error, currentUserEmail); // Handle error
                  }
              }
          };
          try {
              xhr.send(formData); // Send the form data
          } catch (error) {
              handleError('Error sending signup request', error, currentUserEmail); // Handle error
          }
      } else {
          // Prevent form submission if there are errors
          logAuthenticationAction(currentUserEmail, 'Signup validation failed'); // Log validation failure
          return false;
      }
  } catch (error) {
      handleError('Error during signup form submission', error, currentUserEmail); // Handle error
  }
});

document.getElementById('form_login').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent default form submission

  try {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const loginError = document.getElementById('login-error');

      if (!email || !password) {
          loginError.textContent = "Please enter both email and password"; // Set error message
          loginError.classList.add('visible'); // Show error message
          logAuthenticationAction(currentUserEmail, 'Login failed: missing credentials'); // Log missing credentials
          return;
      }

      const loginData = { email, password };
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/login', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('CSRF-Token', getCsrfToken()); // Include CSRF token in headers
      xhr.onload = function () {
          try {
              const response = JSON.parse(xhr.responseText);
              if (xhr.status === 200) {
                  alert('Logged in successfully.'); // Show success message
                  currentUserEmail = email; // Store the email of the logged-in user
                  console.log('User logged in with email:', currentUserEmail); // Debug log
                  logAuthenticationAction(currentUserEmail, 'User logged in successfully'); // Log the action
                  localStorage.setItem('currentUserEmail', currentUserEmail); // Save to local storage
                  // Clear out fields here
                  document.getElementById('email').value = '';
                  document.getElementById('password').value = '';

                  if (response.roles.includes('admin')) {
                      logAdminAction(currentUserEmail, 'Admin logged in'); // Log admin login
                      window.location.href = 'admin.html'; // Redirect to admin page
                  } else {
                      window.location.href = 'user.html'; // Redirect to user page
                  }
              } else {
                  if (response.error.includes('invalid csrf token')) {
                      handleError('Invalid CSRF token during login', new Error('Invalid CSRF token'), currentUserEmail);
                  }
                  loginError.textContent = response.error || 'An error occurred. Please try again.'; // Set error message
                  loginError.classList.add('visible'); // Show error message
                  logAuthenticationAction(currentUserEmail, 'Login error: ' + (response.error || 'Unknown error')); // Log error
              }
          } catch (error) {
              handleError('Error parsing login response', error, currentUserEmail); // Handle error
          }
      };
      try {
          xhr.send(JSON.stringify(loginData)); // Send login data
      } catch (error) {
          handleError('Error sending login request', error, currentUserEmail); // Handle error
      }
  } catch (error) {
      handleError('Error during login form submission', error, currentUserEmail); // Handle error
  }
});