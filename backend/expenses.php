<?php
include 'db.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'get') {
  $stmt = $pdo->query("SELECT id, name, icon FROM expenses");
  $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
  $stmt = $pdo->prepare("SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance FROM transactions");
  $stmt->execute();
  $balance = $stmt->fetchColumn() ?: 0;
  echo json_encode(['expenses' => $expenses, 'balance' => $balance]);
} elseif ($action === 'add_category') {
  $name = $_GET['name'] ?? '';
  $icon = $_GET['icon'] ?? 'fa-shopping-cart'; // Default icon
  $stmt = $pdo->prepare("INSERT INTO expenses (name, icon) VALUES (?, ?)");
  $stmt->execute([$name, $icon]);
  echo json_encode(['status' => 'success']);
} elseif ($action === 'delete') {
  $id = $_POST['id'] ?? 0;
  $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['status' => 'success']);
} else {
  echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}
?>