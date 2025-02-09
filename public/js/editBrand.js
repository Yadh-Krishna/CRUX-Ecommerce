
//Form Validation
document.getElementById("editBrandForm").addEventListener("submit", function (event) {
    let isValid = true;  
  
    // Validate Name (No Numbers)
    const nameInput = document.getElementById("brand_name");
    const nameError = document.getElementById("nameError");
    if (/\d/.test(nameInput.value)|| !nameInput.value.trim()) {
        nameError.classList.remove("d-none");
        isValid = false;
    } else {
        nameError.classList.add("d-none");
    }
  
    // Validate Description (At least 15 words)
    const descriptionInput = document.getElementById("brand_description");
    const descriptionError = document.getElementById("descriptionError");
    const wordCount = descriptionInput.value.trim().split(/\s+/).length;
    if (wordCount < 15) {
        descriptionError.classList.remove("d-none");
        isValid = false;
    } else {
        descriptionError.classList.add("d-none");
    }
  
    // Prevent form submission if validation fails
    if (!isValid) {
        event.preventDefault();
    }
  });
  
  // Auto fade-out alerts after 5 seconds
  setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.classList.add('fade'); // Bootstrap fade class
        setTimeout(() => alert.remove(), 500); // Remove after fade animation
    });
  }, 5000);

  function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function () {
            document.getElementById("imagePreview").src = reader.result;
        };
        reader.readAsDataURL(file);
    }
} 


  