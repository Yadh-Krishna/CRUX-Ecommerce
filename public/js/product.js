document.addEventListener("DOMContentLoaded", function () {
  let cropper;
  let croppedImages = [];
  const imageInput = document.getElementById("imageInput");
  const cropperModal = new bootstrap.Modal(document.getElementById("cropperModal"));
  const cropperImage = document.getElementById("cropperImage");
  const imagePreview = document.getElementById("imagePreview");
  let filesArray = [];
  let currentFileIndex = 0;

  imageInput.addEventListener("change", function (event) {
    filesArray = Array.from(event.target.files);
    if (filesArray.length > 0) {
      currentFileIndex = 0;
      openCropper(filesArray[currentFileIndex]);
    }
  });

  function openCropper(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      cropperImage.src = e.target.result;
      cropperModal.show();
      setTimeout(() => {
        if (cropper) cropper.destroy();
        cropper = new Cropper(cropperImage, { aspectRatio: 1, viewMode: 1 });
      }, 500);
    };
    reader.readAsDataURL(file);
  }

  document.getElementById("cropImageBtn").addEventListener("click", function () {
    if (cropper) {
      cropper.getCroppedCanvas().toBlob((blob) => {
        const file = new File([blob], `cropped_${Date.now()}.jpg`, { type: "image/jpeg" });
        croppedImages.push(file);
        
        const imgElement = document.createElement("img");
        imgElement.src = URL.createObjectURL(file);
        imgElement.classList.add("img-thumbnail", "me-2");
        imgElement.style.width = "100px";
        imagePreview.appendChild(imgElement);
        
        if (currentFileIndex < filesArray.length - 1) {
          currentFileIndex++;
          openCropper(filesArray[currentFileIndex]);
        } else {
          updateFileInput();
          cropperModal.hide();
        }
      });
    }
  });

  function updateFileInput() {
    const dataTransfer = new DataTransfer();
    croppedImages.forEach((img) => dataTransfer.items.add(img));
    imageInput.files = dataTransfer.files;
  }

  // Form validation
  const form = document.getElementById("addProductForm");
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    let isValid = true;

    document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");
    
    const name = document.querySelector("input[name='name']").value.trim();
    const description = document.querySelector("textarea[name='description']").value.trim();
    const price = parseFloat(document.querySelector("input[name='price']").value);
    const discount = parseFloat(document.querySelector("input[name='discount']").value);
    const stock = parseInt(document.querySelector("input[name='stock']").value);
    const images = imageInput.files;

    if (!name) {
      showError("nameError", "Product name is required.");
      isValid = false;
    }
    if (description.split(" ").length < 20) {
      showError("descriptionError", "Description must be at least 20 words.");
      isValid = false;
    }
    if (price <= 0 || isNaN(price)) {
      showError("priceError", "Price must be greater than 0.");
      isValid = false;
    }
    if (discount < 0 || isNaN(discount)) {
      showError("discountError", "Discount cannot be negative.");
      isValid = false;
    }
    if (stock < 5 || isNaN(stock)) {
      showError("stockError", "Stock must be at least 5.");
      isValid = false;
    }
    if (images.length < 3) {
      showError("imageError", "You must upload at least 3 images.");
      isValid = false;
    }

    if (isValid) {
      form.submit();
    }
  });

  function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
  }
});
