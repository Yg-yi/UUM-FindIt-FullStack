// 1. SESSION CHECK 
function checkSession() {
    var user = localStorage.getItem("username");
    if (!user && !window.location.href.includes("login.html")) {
        window.location.href = "login.html";
    }
    if ($("#displayUser").length) {
        $("#displayUser").text(user);
    }
}

// 2. LOGOUT FUNCTION (Beautiful SweetAlert) 
function logout() {
    Swal.fire({
        title: 'Logout?',
        text: "Are you sure you want to exit?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#6200ea',
        confirmButtonText: 'Yes, logout!',
        cancelButtonText: 'Stay here'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("username");
            window.location.href = "login.html";
        }
    });
}

// 3. LOAD ITEMS 
function loadItems() {
    if ($("#itemsList").length === 0) return;

    var currentUser = localStorage.getItem("username");

    $.ajax({
        url: 'https://uumfindit.atwebpages.com/php/api.php?action=read',
        type: 'GET',
        dataType: 'json',
        cache: false,
        success: function(data) {
            var output = "";
            
            if (!data || data.length === 0) {
                $("#itemsList").html("<div class='text-center mt-5'><p class='text-muted'>No items found yet.</p></div>");
                return;
            }

            var searchVal = $("#searchInput").val() ? $("#searchInput").val().toLowerCase() : "";
            var catFilter = $("#categoryFilter").val() || ""; 

            $.each(data, function(index, item) {
                
                // FILTER LOGIC
                var matchesSearch = item.item_name.toLowerCase().includes(searchVal) || searchVal === "";
                var matchesCat = (catFilter === "" || item.category === catFilter);

                if (matchesSearch && matchesCat) {
                    var timeAgo = (typeof moment !== 'undefined') ? moment(item.date_found).fromNow() : item.date_found;
                    
                    // IMAGE LOGIC
                    var imgUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${item.item_name}`; 
                    var imgClass = "rounded-circle border"; 

                    if(item.image_path && item.image_path !== "") {
                        var photos = item.image_path.split(",");
                        if (photos.length > 0 && photos[0] !== "") {
                            imgUrl = photos[0];
                            imgClass = "rounded border";
                        }
                    }

                    // STATUS COLOURS
                    var statusColor = "secondary";
                    if(item.status === "Returned") statusColor = "success";
                    if(item.status === "Pending") statusColor = "warning text-dark";

                    // OWNERSHIP CHECK 
                    var isOwner = (item.created_by === currentUser);
                    var ownerBadge = "";

                    if (isOwner) {
                        ownerBadge = '<span class="badge bg-primary ms-1" style="font-size: 0.6rem;">(Me) ✏️</span>';
                    }

                    // CARD HTML
                    output += `
                    <div class="col-md-6 mb-3">
                        <div class="card shadow-sm position-relative" onclick="viewDetail(${item.id})" style="cursor: pointer; border-radius: 15px;">
                            
                            <span class="badge bg-${statusColor} position-absolute top-0 end-0 m-2 shadow-sm">
                                ${item.status}
                            </span>

                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <img src="${imgUrl}" width="60" height="60" class="${imgClass} me-3" style="object-fit: cover;">
                                    <div>
                                        <h6 class="mb-0 fw-bold text-dark">${item.item_name}</h6>
                                        <small class="text-muted d-block">${item.category}</small>
                                        <small class="text-muted" style="font-size: 0.8rem;">
                                            By: ${item.created_by} ${ownerBadge}
                                        </small>
                                        <div class="text-muted mt-1" style="font-size: 0.7rem;">
                                            🕒 ${timeAgo}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }
            });
            $("#itemsList").html(output);
        },
        error: function(xhr) {
            console.log("Error:", xhr.responseText);
            $("#itemsList").html("<p class='text-center text-danger'>Connection Failed</p>");
        }
    });
}

// 4. VIEW DETAIL 
function viewDetail(id) {
    sessionStorage.setItem("current_item_id", id);
    window.location.href = "detail.html";
}

// 5. INITIALIZE 
$(document).ready(function() {
    console.log("App Ready");
    checkSession();
    loadItems();

    // Listeners for Search/Filter
    $("#searchInput, #categoryFilter").on("input change", function() {
        loadItems();
    });
    
    // POST ITEM FORM SUBMIT (Beautiful SweetAlert) 
    $(document).on('submit', '#reportForm', function(e) {
        e.preventDefault(); 
        var currentUser = localStorage.getItem("username");
        if (!currentUser) { 
            Swal.fire('Error', 'Session expired. Please login again.', 'error');
            window.location.href = "login.html"; 
            return; 
        }

        // Show Loading Spinner
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we post your item.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        var formData = new FormData(this); 
        formData.append('action', 'create');
        formData.append('created_by', currentUser);

        $.ajax({
            url: 'https://uumfindit.atwebpages.com/php/api.php?action=read',
            type: 'POST',
            data: formData,
            contentType: false, processData: false, dataType: 'json',
            success: function(response) {
                if(response.status === "success") {
                    // Success Popup
                    Swal.fire({
                        title: 'Success!',
                        text: 'Item posted successfully!',
                        icon: 'success',
                        confirmButtonColor: '#6200ea'
                    }).then(() => {
                        window.location.href = "index.html";
                    });
                } else {
                    // Error Popup
                    Swal.fire('Error', response.message, 'error');
                }
            },
            error: function(xhr) { 
                Swal.fire('Network Error', 'Could not connect to server.', 'error');
            }
        });
    });
});
