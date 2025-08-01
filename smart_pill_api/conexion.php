<?php
// db.php
$host = "localhost";
$user = "root";
$pass = "";
$db = "smart_pill";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(["error" => "Conexión fallida"]));
}
$conn->set_charset("utf8");
?>