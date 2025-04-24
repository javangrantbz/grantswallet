<?php
ob_start(); // Start output buffering to catch stray output
include 'db.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action == 'add') {
    $category = $_POST['category'];
    $amount = floatval($_POST['amount']);
    $period = $_POST['period'] ?? 'month';

    if (!$category || $amount <= 0 || !in_array($period, ['month', 'week'])) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid input']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO budget_goals (category, amount, period) VALUES (?, ?, ?)");
    $stmt->execute([$category, $amount, $period]);

    echo json_encode(['status' => 'success']);
} elseif ($action == 'get') {
    $stmt = $pdo->prepare("SELECT * FROM budget_goals ORDER BY created_at DESC");
    $stmt->execute();
    $goals = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['goals' => $goals]);
} elseif ($action == 'delete') {
    $id = $_POST['id'];
    if (!isset($id) || !is_numeric($id)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM budget_goals WHERE id = ?");
    $stmt->execute([$id]);
    $affected = $stmt->rowCount();
    if ($affected === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Goal not found']);
        exit;
    }
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}

ob_end_flush(); // Send output and clear buffer
?>