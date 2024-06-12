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