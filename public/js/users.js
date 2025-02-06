document.addEventListener("DOMContentLoaded", () => {
    const searchBar = document.getElementById("searchBar");
    const searchSuggestions = document.getElementById("searchSuggestions");
    let debounceTimeout;

    // Function to fetch search suggestions
    const fetchSearchResults = async (searchTerm) => {
        if (searchTerm.length === 0) {
            searchSuggestions.style.display = "none";
            return;
        }

        try {
            const response = await fetch(`/admin/users/search?term=${encodeURIComponent(searchTerm)}`);
            const users = await response.json();

            if (users.length > 0) {
                searchSuggestions.innerHTML = users.map(user => `
                    <div class="list-group-item" onclick="selectUser('${user.fullName}')">
                        ${user.fullName} (${user.email})
                    </div>
                `).join("");
                searchSuggestions.style.display = "block";
            } else {
                searchSuggestions.style.display = "none";
            }
        } catch (error) {
            console.error("Error fetching search suggestions:", error);
        }
    };

    // Debounce function to optimize API calls
    const debounceSearch = (searchTerm) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => fetchSearchResults(searchTerm), 300);
    };

    // Listen for input in the search bar
    searchBar.addEventListener("input", (e) => {
        const searchTerm = e.target.value.trim();
        debounceSearch(searchTerm);
    });

    // Select user from suggestions
    window.selectUser = (userName) => {
        searchBar.value = userName;
        searchSuggestions.style.display = "none";
    };

    // Hide suggestions when clicking outside
    document.addEventListener("click", (event) => {
        if (!searchBar.contains(event.target) && !searchSuggestions.contains(event.target)) {
            searchSuggestions.style.display = "none";
        }
    });
});

document.querySelectorAll(".pagination a").forEach(link => {
    link.addEventListener("click", async (e) => {
        e.preventDefault();
        const url = e.target.href;
        const response = await fetch(url);
        const html = await response.text();

        // Extract the new user list and pagination from the response
        const newDocument = new DOMParser().parseFromString(html, "text/html");
        const newTable = newDocument.querySelector("table").outerHTML;
        const newPagination = newDocument.querySelector(".pagination").outerHTML;

        // Replace existing user list and pagination
        document.querySelector("table").outerHTML = newTable;
        document.querySelector(".pagination").outerHTML = newPagination;

        // Re-attach event listeners to new pagination links
        attachPaginationEvents();
    });
});

// Function to re-attach pagination event listeners
function attachPaginationEvents() {
    document.querySelectorAll(".pagination a").forEach(link => {
        link.addEventListener("click", async (e) => {
            e.preventDefault();
            const url = e.target.href;
            const response = await fetch(url);
            const html = await response.text();

            const newDocument = new DOMParser().parseFromString(html, "text/html");
            document.querySelector("table").outerHTML = newDocument.querySelector("table").outerHTML;
            document.querySelector(".pagination").outerHTML = newDocument.querySelector(".pagination").outerHTML;
            attachPaginationEvents(); // Re-attach after replacing elements
        });
    });
}

async function toggleUserStatus(userId) {
    try {
        const response = await fetch(`/admin/users/toggle-status/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({}) // Prevent empty body errors
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        // Check if the result contains isActive (or isBlocked based on your schema)
        if (result.hasOwnProperty("isActive")) {
           // Get the status badge element
           const statusElement = document.getElementById(`status-${userId}`);

           // Remove previous badge classes
           statusElement.classList.remove("text-success", "text-danger");

           // Apply new class dynamically
           if (result.isActive) {
               statusElement.classList.add("text-success");
               statusElement.textContent = "Active";
           } else {
               statusElement.classList.add("text-danger");
               statusElement.textContent = "Inactive";
           }

           // Update button text dynamically
           document.querySelector(`button[data-user-id="${userId}"]`).textContent = result.isActive ? "Block" : "Unblock";
        } else {
            alert("Unexpected response format. Please try again.");
        }
    } catch (error) {
        console.error("Error updating user status:", error);
        alert("An error occurred while updating user status.");
    }
}