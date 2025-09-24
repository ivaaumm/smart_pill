<?php
// db.php
// Configurar zona horaria de Argentina
date_default_timezone_set('America/Argentina/Buenos_Aires');

$host = "192.168.1.87";
$user = "root";
$pass = "";
$db = "smart_pill";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die(json_encode(["error" => "Conexión fallida"]));
}
$conn->set_charset("utf8");
?>
