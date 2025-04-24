<?php
include 'db.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'get') {
  $stmt = $pdo->query("SELECT id, name, target_amount, current_amount FROM savings_goals");
  $goals = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['goals' => $goals]);
} elseif ($action === 'add') {
  $name = $_GET['name'] ?? '';
  $target_amount = $_GET['target_amount'] ?? 0;
  $stmt = $pdo->prepare("INSERT INTO savings_goals (name, target_amount) VALUES (?, ?)");
  $stmt->execute([$name, $target_amount]);
  echo json_encode(['status' => 'success']);
} elseif ($action === 'contribute') {
  $id = $_GET['id'] ?? 0;
  $amount = $_GET['amount'] ?? 0;
  $stmt = $pdo->prepare("UPDATE savings_goals SET current_amount = current_amount + ? WHERE id = ?");
  $stmt->execute([$amount, $id]);
  // Log as transaction
  $stmt = $pdo->prepare("INSERT INTO transactions (type, name, amount) VALUES ('savings', ?, ?)");
  $stmt->execute(["Savings: $id", $amount]);
  echo json_encode(['status' => 'success']);
} elseif ($action === 'delete') {
  $id = $_POST['id'] ?? 0;
  $stmt = $pdo->prepare("DELETE FROM savings_goals WHERE id = ?");
  $stmt->execute([$id]);
  echo json_encode(['status' => 'success']);
} else {
  echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}
?>