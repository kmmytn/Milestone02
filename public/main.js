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

document.getElementById('form_input').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevent the form from submitting normally

    const formData = new FormData(this); // Get form data
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/signup', true);
    xhr.onload = function() {
        if (xhr.status === 200) {
            alert(xhr.responseText); // Show success message
        } else {
            alert('An error occurred during signup.');
        }
    };
    xhr.send(formData);
});