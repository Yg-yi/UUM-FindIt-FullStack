<?php

include 'db_connect.php';
header('Content-Type: application/json');

if (!isset($conn) || $conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// 1. READ 
if ($action === 'read') {

    $sql = "SELECT * FROM items ORDER BY date_found DESC";
    $result = $conn->query($sql);
    $rows = [];
    if ($result) {
        while($r = $result->fetch_assoc()) { $rows[] = $r; }
    }
    echo json_encode($rows);
    exit;
}

// 2. READ ONE 
if ($action === 'read_one') {
    // Use $_REQUEST to catch the ID from any source
    $id = isset($_REQUEST['id']) ? intval($_REQUEST['id']) : 0;
    
    if ($id > 0) {
        $sql = "SELECT * FROM items WHERE id = $id";
        $result = $conn->query($sql);
        $data = $result->fetch_assoc();
        echo json_encode($data ? $data : ["error" => "Item not found"]);
    } else {
        echo json_encode(["error" => "Invalid ID"]);
    }
    exit;
}

// 3. CREATE
if ($action === 'create') {
    $name = $conn->real_escape_string($_POST['item_name'] ?? '');
    $cat  = $conn->real_escape_string($_POST['category'] ?? 'Others');
    $desc = $conn->real_escape_string($_POST['description'] ?? '');
    $loc  = $conn->real_escape_string($_POST['location_found'] ?? '');
    $owner = $conn->real_escape_string($_POST['created_by'] ?? 'Anonymous');
    $phone = $conn->real_escape_string($_POST['contact_phone'] ?? '');
    
    // Fix Date
    $dateRaw = $_POST['date_found'] ?? date('Y-m-d H:i:s');
    $date = str_replace("T", " ", $dateRaw);
    $date = $conn->real_escape_string($date);

    // SMART FILE UPLOAD LOGIC
    $savedFiles = []; 
    $targetDir = "../uploads/";

    // 1. Check if folder exists
    if (!file_exists($targetDir)) {
        if (!mkdir($targetDir, 0755, true)) {
            echo json_encode(["status" => "error", "message" => "Failed to create 'uploads' folder."]);
            exit;
        }
    }

    if (isset($_FILES['cameraInput'])) {
    $fileAry = $_FILES['cameraInput'];
    $fileCount = count($fileAry['name']);

    for ($i = 0; $i < $fileCount; $i++) {
        if ($i >= 5) break; // Force limit to 5 photos max

        if ($fileAry['error'][$i] == 0) {
            $ext = pathinfo($fileAry['name'][$i], PATHINFO_EXTENSION);
            $fileName = "item_" . uniqid() . "_" . $i . "." . $ext;
            $targetFile = $targetDir . $fileName;

            if (move_uploaded_file($fileAry['tmp_name'][$i], $targetFile)) {
                $savedFiles[] = "uploads/" . $fileName;
            }
        }
    }
}

    // Join paths with comma
    $imagePathStr = implode(",", $savedFiles);
    // -------------------------------

    $sql = "INSERT INTO items (item_name, category, description, location_found, date_found, contact_phone, created_by, image_path) 
            VALUES ('$name', '$cat', '$desc', '$loc', '$date', '$phone', '$owner', '$imagePathStr')";
    
    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $conn->error]);
    }
    exit;
}

// 4. UPDATE
if ($action === 'update') {
    $id     = intval($_POST['id']);
    $name   = $conn->real_escape_string($_POST['item_name'] ?? '');
    $cat    = $conn->real_escape_string($_POST['category'] ?? 'Others'); 
    $desc   = $conn->real_escape_string($_POST['description'] ?? '');
    $loc    = $conn->real_escape_string($_POST['location_found'] ?? '');  
    $phone  = $conn->real_escape_string($_POST['contact_phone'] ?? '');   
    $status = $conn->real_escape_string($_POST['status'] ?? 'Unclaimed');

    // Updated SQL to include all the new fields
    $sql = "UPDATE items SET 
            item_name='$name', 
            category='$cat', 
            description='$desc', 
            location_found='$loc', 
            contact_phone='$phone', 
            status='$status' 
            WHERE id=$id";
    echo ($conn->query($sql) === TRUE) ? json_encode(["status" => "success"]) : json_encode(["status" => "error"]);
    exit;
}

// 5. DELETE
if ($action === 'delete') {
    $id = intval($_POST['id']);
    // Extra safety: check user here 
    $sql = "DELETE FROM items WHERE id=$id";
    echo ($conn->query($sql) === TRUE) ? json_encode(["status" => "success"]) : json_encode(["status" => "error"]);
    exit;
}

$conn->close();
?>
