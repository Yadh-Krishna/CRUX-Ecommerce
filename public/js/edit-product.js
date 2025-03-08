document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("editProductForm");
    const imageInputs = document.querySelectorAll(".edit-image-input");
    const additionalImageInput = document.getElementById("additionalImages");
    const additionalImagePreview = document.getElementById("additionalImagePreview");
    const cropperModal = new bootstrap.Modal(document.getElementById("cropperModal"));
    const cropperImage = document.getElementById("cropperImage");
    const cropImageBtn = document.getElementById("cropImageBtn");
    let cropper;

    if (!form) {
        console.error("Edit product form not found.");
        return;
    }

    //Error Elements
    const errors = {
        name: document.getElementById("nameError"),
        description: document.getElementById("descError"),
        price: document.getElementById("priceError"),
        discount: document.getElementById("discountError"),
        stock: document.getElementById("stockError"),
    };

    const formAction = form.getAttribute("action");
    if (!formAction) {
        console.error("Form action attribute is missing.");
        return;
    }

    const productId = formAction.split("/").pop();

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        let isValid = validateForm();
        if (!isValid) return;

        const formData = new FormData();
        formData.append("name", form.name.value.trim());
        formData.append("description", form.description.value.trim());
        formData.append("price", form.price.value);
        formData.append("discount", form.discount.value);
        formData.append("stock", form.stock.value);
        formData.append("category", form.category.value);
        formData.append("brands", form.brands.value);
        formData.append("gender", form.gender.value);

        let replacedIndexes = [];

        imageInputs.forEach(input => {
            if (input.files.length > 0) {
                formData.append("replacedImages", input.files[0]);
                replacedIndexes.push(input.dataset.index);
            }
        });

        formData.append("replacedIndexes", JSON.stringify(replacedIndexes));

        if (additionalImageInput.files.length > 0) {
            Array.from(additionalImageInput.files).forEach(file => {
                formData.append("addImages", file);
            });
        }

        try {
            const response = await fetch(`/admin/products/edit/${productId}`, {
                method: "PUT",
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                Swal.fire({
                    title: "Success!",
                    text: "Product updated successfully!",
                    icon: "success",
                    confirmButtonText: "OK"
                }).then(() => {
                    window.location.href = "/admin/products";
                });
            } else {
                handleErrors(result.errors);

                Swal.fire({
                    title: "Error!",
                    text: result.error || "Something went wrong!",
                    icon: "error",
                    confirmButtonText: "Try Again"
                });
            }
        } catch (error) {
            console.error("Error updating product:", error);
            Swal.fire({
                title: "Error!",
                text: "An unexpected error occurred.",
                icon: "error",
                confirmButtonText: "OK"
            });
        }
    });

        document.querySelectorAll(".edit-image").forEach(button => {
        button.addEventListener("click", function () {
            const index = this.dataset.index;
            const fileInput = document.querySelector(`.edit-image-input[data-index="${index}"]`);
            fileInput.click();
        });
    });

    imageInputs.forEach(input => {
        input.addEventListener("change", function (event) {
            handleImageUpload(event.target);
        });
    });

    additionalImageInput.addEventListener("change", function (event) {
        Array.from(event.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                showCropper(e.target.result, file, true);
            };
            reader.readAsDataURL(file);
        });
    });

    function handleImageUpload(fileInput) {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                showCropper(e.target.result, file, false, fileInput);
            };
            reader.readAsDataURL(file);
        }
    }

    function showCropper(imageSrc, file, isAdditional, fileInput = null) {
        cropperImage.src = imageSrc;
        cropperModal.show();
    
        setTimeout(() => {
            if (cropper) cropper.destroy();
            cropper = new Cropper(cropperImage, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 1,
                movable: true,
                zoomable: true,
                scalable: true,
                responsive: true,
                minCropBoxWidth: 300,  
                minCropBoxHeight: 300  
            });
        }, 500);
    
        cropImageBtn.onclick = function () {
            if (!cropper) return;
    
            cropper.getCroppedCanvas({ width: 500, height: 500 }).toBlob(blob => {
                const croppedFile = new File([blob], file.name, { type: "image/jpeg" });
    
                if (isAdditional) {
                    addCroppedImagePreview(croppedFile);
                } else if (fileInput) {
                    updateExistingImagePreview(fileInput, croppedFile);
                }
    
                cropperModal.hide();
                cropper.destroy();
            }, "image/jpeg");
        };
    }
    
    function addCroppedImagePreview(file) {
        const url = URL.createObjectURL(file);
        const imgElement = document.createElement("img");
        imgElement.src = url;
        imgElement.classList.add("img-thumbnail", "preview-img");
        imgElement.style.width = "100px";
        imgElement.style.height = "100px";
        additionalImagePreview.appendChild(imgElement);
    }
    
    function updateExistingImagePreview(fileInput, croppedFile) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(croppedFile);
        fileInput.files = dataTransfer.files;
    
        const previewImage = document.querySelector(`.preview-img[data-index="${fileInput.dataset.index}"]`);
        if (previewImage) previewImage.src = URL.createObjectURL(croppedFile);
    }

        function validateForm() {
        let isValid = true;
        Object.values(errors).forEach(error => error.textContent = ""); // Clear previous errors
        
        
        
        if (!form.name.value.trim()) {
            errors.name.textContent = "Product name is required.";
            isValid = false;
        }

        if (form.description.value.trim().split(/\s+/).length < 20) {
            errors.description.textContent = "Description must be at least 20 words.";
            isValid = false;
        }

        if (parseFloat(form.price.value) < 0) {
            errors.price.textContent = "Price cannot be negative.";
            isValid = false;
        }

        if (parseFloat(form.discount.value) < 0||parseFloat(form.discount.value)>100) {
            errors.discount.textContent = "Discount cannot be negative and cannot be greater than 100";
            isValid = false;
        }

        if (parseInt(form.stock.value) < 5) {
            errors.stock.textContent = "Stock must be at least 5.";
            isValid = false;
        }
        
        return isValid;
    }
    function handleErrors(errorList) {
        if (!errorList) return;
    
        if (errorList.name) errors.name.textContent = errorList.name;
        if (errorList.description) errors.description.textContent = errorList.description;
        if (errorList.price) errors.price.textContent = errorList.price;
        if (errorList.discount) errors.discount.textContent = errorList.discount;
        if (errorList.stock) errors.stock.textContent = errorList.stock;
    
        if (errorList.addImages) {
            Swal.fire({
                title: "Image Error",
                text: errorList.addImages,
                icon: "error"
            });
        }
    }
});







// document.addEventListener("DOMContentLoaded", function () {
//     const form = document.getElementById("editProductForm");
//     const imageInputs = document.querySelectorAll(".edit-image-input");
//     const cropperModal = new bootstrap.Modal(document.getElementById("cropperModal"));
//     const cropperImage = document.getElementById("cropperImage");
//     const cropImageBtn = document.getElementById("cropImageBtn");
//     let cropper;

//     // Error Elements
//     const errors = {
//         name: document.getElementById("nameError"),
//         description: document.getElementById("descError"),
//         price: document.getElementById("priceError"),
//         discount: document.getElementById("discountError"),
//         stock: document.getElementById("stockError"),
//     };

//     if (!form) {
//         console.error("Edit product form not found.");
//         return;
//     }

//     const formAction = form.getAttribute("action");
//     if (!formAction) {
//         console.error("Form action attribute is missing.");
//         return;
//     }

//     const productId = formAction.split("/").pop();

//     form.addEventListener("submit", async function (event) {
//         event.preventDefault(); // Prevent default form submission
       

//         let isValid = validateForm();        
//         if (!isValid) return;

//         const formData = new FormData();
//         const productId = form.getAttribute("action").split("/").pop();

//         // Collect form inputs
//         formData.append("name", form.name.value.trim());
//         formData.append("description", form.description.value.trim());
//         formData.append("price", form.price.value);
//         formData.append("discount", form.discount.value);
//         formData.append("stock", form.stock.value);
//         formData.append("category", form.category.value);
//         formData.append("brands", form.brands.value);
//         formData.append("gender", form.gender.value);

//         let replacedIndexes = [];

//         // Collect images (Only changed ones)
//         imageInputs.forEach(input => {
//             if (input.files.length > 0) {
//                 formData.append("replacedImages", input.files[0]);
//                 replacedIndexes.push(input.dataset.index); // Store the index of the replaced image
//             }
//         });

//         // Send the array of indexes as a JSON string
//         formData.append("replacedIndexes", JSON.stringify(replacedIndexes));

//         try {
            
//             const response = await fetch(`/admin/products/edit/${productId}`, {
//                 method: "PUT",
//                 body: formData, 
//             });

//             const result = await response.json();
            
//             if (response.ok) {
//                 Swal.fire({
//                     title: "Success!",
//                     text: "Product updated successfully!",
//                     icon: "success",
//                     confirmButtonText: "OK"
//                 }).then(() => {
//                     window.location.href = "    /admin/products"; // Redirect after confirmation
//                 });
//             } else {
//                 Swal.fire({
//                     title: "Error!",
//                     text: result.error || "Something went wrong!",
//                     icon: "error",
//                     confirmButtonText: "Try Again"
//                 });
//             }
//         } catch (error) {
//             console.error("Error updating product:", error);
//             Swal.fire({
//                 title: "Error!",
//                 text: "An unexpected error occurred.",
//                 icon: "error",
//                 confirmButtonText: "OK"
//             });
//         }
//     });

//     function validateForm() {
//         let isValid = true;
//         Object.values(errors).forEach(error => error.textContent = ""); // Clear previous errors
        
        
        
//         if (!form.name.value.trim()) {
//             errors.name.textContent = "Product name is required.";
//             isValid = false;
//         }

//         if (form.description.value.trim().split(/\s+/).length < 20) {
//             errors.description.textContent = "Description must be at least 20 words.";
//             isValid = false;
//         }

//         if (parseFloat(form.price.value) < 0) {
//             errors.price.textContent = "Price cannot be negative.";
//             isValid = false;
//         }

//         if (parseFloat(form.discount.value) < 0) {
//             errors.discount.textContent = "Discount cannot be negative.";
//             isValid = false;
//         }

//         if (parseInt(form.stock.value) < 5) {
//             errors.stock.textContent = "Stock must be at least 5.";
//             isValid = false;
//         }
        
//         return isValid;
//     }

//     function handleErrors(errorList) {
//         if (errorList.name) errors.name.textContent = errorList.name;
//         if (errorList.description) errors.description.textContent = errorList.description;
//         if (errorList.price) errors.price.textContent = errorList.price;
//         if (errorList.discount) errors.discount.textContent = errorList.discount;
//         if (errorList.stock) errors.stock.textContent = errorList.stock;
//     }

//     document.querySelectorAll(".edit-image").forEach(button => {
//         button.addEventListener("click", function () {
//             const index = this.dataset.index;
//             const fileInput = document.querySelector(`.edit-image-input[data-index="${index}"]`);
//             fileInput.click();
//         });
//     });

//     imageInputs.forEach(input => {
//         input.addEventListener("change", function (event) {
//             const file = event.target.files[0];
//             if (file) {
//                 const reader = new FileReader();
//                 reader.onload = function (e) {
//                     showCropper(e.target.result, input);
//                 };
//                 reader.readAsDataURL(file);
//             }
//         });
//     });

//     function showCropper(imageSrc, fileInput) {
//         cropperImage.src = imageSrc;
//         cropperModal.show();

//         if (cropper) cropper.destroy();
//         cropper = new Cropper(cropperImage, {
//             aspectRatio: 1,
//             viewMode: 1,
//             autoCropArea: 1,
//             movable: true,
//             zoomable: true,
//         });

//         cropImageBtn.onclick = function () {
//             const canvas = cropper.getCroppedCanvas({ width: 300, height: 300 });
//             canvas.toBlob(blob => {
//                 const croppedFile = new File([blob], fileInput.files[0].name, { type: "image/jpeg" });
//                 const dataTransfer = new DataTransfer();
//                 dataTransfer.items.add(croppedFile);
//                 fileInput.files = dataTransfer.files;

//                 const previewImage = document.querySelector(`.preview-img[data-index="${fileInput.dataset.index}"]`);
//                 previewImage.src = URL.createObjectURL(blob);

//                 cropperModal.hide();
//                 cropper.destroy();
//             }, "image/jpeg");
//         };
//     }
// });
