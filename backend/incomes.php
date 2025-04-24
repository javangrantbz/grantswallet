<?php
include 'db.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'get') {
  $stmt = $pdo->query("SELECT id, name, icon FROM incomes");
  $incomes = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['incomes' => $incomes]);
} elseif ($action === 'add') {
  $name = $_GET['name'] ?? '';
  $icon = $_GET['icon'] ?? 'fa-dollar-sign'; // Default icon
  $stmt = $pdo->prepare("INSERT INTO incomes (name, icon) VALUES (?, ?)");
  $stmt->execute([$name, $icon]);
  echo json_encode(['status' => 'success']);
} elseif ($action === 'delete') {
  $id = $_POST['id'] ?? 0;
  $stmt = $pdo->prepare("DELETE FROM incomes WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['status' => 'success']);
}else {
  echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}
?>