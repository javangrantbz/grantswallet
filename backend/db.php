<?php
try {
    $dsn = "mysql:host=localhost;dbname=budget_db;charset=utf8";
    $username = "root"; // Replace with your MySQL username
    $password = "";     // Replace with your MySQL password
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}
?>