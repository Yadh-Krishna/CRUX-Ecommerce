function userStatusAlter(id){
    const url=`/admin/users/delete/${id}`;
    fetch(url,{
        method:"PATCH"})
        .then(response => response.json())
        .then(data=>{
            console.log(data);
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
}, 5000);