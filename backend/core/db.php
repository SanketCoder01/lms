<?php
require_once __DIR__ . "/env.php";
loadEnv(__DIR__ . "/../.env");

$host = $_ENV["DB_HOST"] ?? "localhost";
$db   = $_ENV["DB_NAME"] ?? "transport_db";
$user = $_ENV["DB_USER"] ?? "root";
$pass = $_ENV["DB_PASS"] ?? "";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(["status"=>"error","message"=>"DB connection failed"]);
    exit;
}
