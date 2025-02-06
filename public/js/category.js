document.addEventListener("DOMContentLoaded", () => {
  const editButtons = document.querySelectorAll(".edit-category");

  editButtons.forEach(button => {
    button.addEventListener("click", function () {
      const categoryId = this.getAttribute("data-id");
      const categoryName = this.getAttribute("data-name");
      const categoryDescription = this.getAttribute("data-description");
      const categoryImage = this.getAttribute("data-image"); // Existing image

      // Populate modal fields
      document.getElementById("editCategoryId").value = categoryId;
      document.getElementById("editCategoryName").value = categoryName;
      document.getElementById("editCategoryDescription").value = categoryDescription;

      // Show existing image if available
      const editImagePreview = document.getElementById("editImagePreview");
      if (categoryImage) {
        editImagePreview.src = categoryImage;
        editImagePreview.style.display = "block";
      } else {
        editImagePreview.style.display = "none";
      }

      // Show modal
      const editCategoryModal = new bootstrap.Modal(document.getElementById("editCategoryModal"));
      editCategoryModal.show();
    });
  });
});

// Handle Edit Form Submission (PUT Request)
document.getElementById("editCategoryForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  
  const categoryId = document.getElementById("editCategoryId").value;
  const formData = new FormData(this);

  try {
    const response = await fetch(`/admin/categories/${categoryId}`, {
      method: "PUT",
      body: formData,
    });

    const result = await response.json();
    if (response.ok) {
      alert("Category updated successfully.");
      window.location.reload();
    } else {
      alert(result.error || "Failed to update category.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while updating category.");
  }
});

 // Handle Block/Unblock Button Click (PATCH Request)
 document.querySelectorAll(".toggle-category-status").forEach(button => {
  button.addEventListener("click", async function () {
    const categoryId = this.getAttribute("data-id");
    
    try {
      const response = await fetch(`/admin/categories/${categoryId}/toggle-status`, {
        method: "PATCH",
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        window.location.reload();
      } else {
        alert(result.error || "Failed to update category status.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while updating category status.");
    }
  });
 });

