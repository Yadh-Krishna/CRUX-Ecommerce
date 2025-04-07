function toggleCategoryStatus(categoryId) {
    fetch(`/admin/categories/${categoryId}/toggle-status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            Swal.fire({
                title: "Success",
                text: data.message,
                icon: "success",
                confirmButtonText: "OK"
            }).then(() => {
                location.reload(); // Reload only after clicking "OK"
            });
        } else {
            Swal.fire({
                title: "Error",
                text: data.message,
                icon: "error",
                confirmButtonText: "OK"
            });
        }
    })
    .catch(error => {
        console.error("Error updating category status:", error);
        alert("Something went wrong!");
    });
}