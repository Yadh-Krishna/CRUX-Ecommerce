document.addEventListener("DOMContentLoaded", () => {
    const editButtons = document.querySelectorAll(".edit-brand");
  
    editButtons.forEach(button => {
      button.addEventListener("click", function () {
        const brandId = this.getAttribute("data-id");
        const brandName = this.getAttribute("data-name");
        const brandDescription = this.getAttribute("data-description");
        const brandImage = this.getAttribute("data-image"); // Existing image
  
        // Populate modal fields
        document.getElementById("editBrandId").value = brandId;
        document.getElementById("editBrandName").value = brandName;
        document.getElementById("editBrandDescription").value = brandDescription;
  
        // Show existing image if available
        const editImagePreview = document.getElementById("editImagePreview");
        if (brandImage) {
          editImagePreview.src = brandImage;
          editImagePreview.style.display = "block";
        } else {
          editImagePreview.style.display = "none";
        }
  
        // Show modal
        const editBrandModal = new bootstrap.Modal(document.getElementById("editBrandModal"));
        editBrandModal.show();
      });
    });
  });
  
  // Handle Edit Form Submission (PUT Request)
  document.getElementById("editBrandForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const brandId = document.getElementById("editBrandId").value;
    const formData = new FormData(this);
  
    try {
      const response = await fetch(`/admin/brands/${brandId}`, {
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
   document.querySelectorAll(".toggle-brand-status").forEach(button => {
    button.addEventListener("click", async function () {
      const brandId = this.getAttribute("data-id");
      
      try {
        const response = await fetch(`/admin/brands/${brandId}/toggle-status`, {
          method: "PATCH",
        });
  
        const result = await response.json();
        if (response.ok) {
          alert(result.message);
          window.location.reload();
        } else {
          alert(result.error || "Failed to update brand status.");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while updating brand status.");
      }
    });
   });
  
  