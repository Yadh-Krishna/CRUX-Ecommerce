function userStatusAlter(id,isActive){
    isActive=isActive==='true';
    Swal.fire({
        title: isActive ? "Block User?":"Unblock User?",
        text: isActive 
            ? "Are you sure you want to block this user?"
            :"Are you sure you want to unblock this user?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: isActive ? "#d33": "#3085d6",
        cancelButtonColor: "#6c757d",
        confirmButtonText: isActive ? "Yes, Block" : "Yes, Unblock" 
    }).then((result) => {
        if (result.isConfirmed) {    
    fetch(`/admin/users/delete/${id}`,{
        method:"PATCH"})
        .then(response => response.json())
        .then(data=>{
            location.reload();
        }).catch((err)=>console.error(err));
}

// Auto fade-out alerts after 5 seconds
setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.classList.add('fade'); // Bootstrap fade class
        setTimeout(() => alert.remove(), 500); // Remove after fade animation
    });
}, 5000)
    })
}