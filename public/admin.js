document.addEventListener("DOMContentLoaded", function() {
    // Function to toggle edit mode
    function toggleEditMode(event) {
        const postContainer = event.target.closest('.post');
        const postText = postContainer.querySelector('.post-text');
        const originalText = postText.textContent;

        // Check if a textarea already exists
        let existingTextarea = document.querySelector('.edit-textarea');
        if (!existingTextarea) {
            // Create a new textarea if it doesn't exist
            existingTextarea = document.createElement('textarea');
            existingTextarea.value = originalText;
            existingTextarea.classList.add('edit-textarea');
            existingTextarea.addEventListener('keydown', handleSave);
            postContainer.insertBefore(existingTextarea, postText);
        } else {
            // Reuse the existing textarea
            existingTextarea.value = originalText;
        }

        // Hide the original post text
        postText.style.display = 'none';
    }

    // Function to handle saving changes
    function handleSave(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const postContainer = event.target.closest('.post');
            const postText = postContainer.querySelector('.post-text');
            postText.textContent = event.target.value;
            postText.style.display = '';
            event.target.remove();
        }
    }

    // Function to handle deleting a post
    function handleDelete(event) {
        const postContainer = event.target.closest('.post');
        postContainer.remove();
    }

    // Attach click event listener to edit buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(button => button.addEventListener('click', toggleEditMode));

    // Attach click event listener to delete buttons
    const deleteButtons = document.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => button.addEventListener('click', handleDelete));

    // Change background color based on category selection
    const postCategories = document.querySelectorAll('.post-category');
    postCategories.forEach(function(postCategory) {
        postCategory.addEventListener('change', function() {
            var content = postCategory.value;
            if (content === "Funny") {
                postCategory.style.backgroundColor = "#BFD58E"; // Greenish color for Funny
            } else if (content === "Not Funny") {
                postCategory.style.backgroundColor = "#FF6961"; // Reddish color for Not Funny
            }
        });
    });
});