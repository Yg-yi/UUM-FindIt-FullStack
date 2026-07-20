<?php
// AwardSpace Credentials 
$servername = "fdb1033.awardspace.net"; 
$username   = "4726050_lostfound";     
$password   = "Mobileproject01"; 
$dbname     = "4726050_lostfound";   

$conn = new mysqli($servername, $username, $password, $dbname);

// Error handling to help debug
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
