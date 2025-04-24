<?php
ob_start(); // Start output buffering
include 'db.php';
header('Content-Type: application/json');

$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action == 'add') {
    $type = $_GET['type'];
    $name = $_GET['name'];
    $amount = floatval($_GET['amount']);
    $date = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare("INSERT INTO transactions (type, name, amount, date) VALUES (?, ?, ?, ?)");
    $stmt->execute([$type, $name, $amount, $date]);

    $stmt = $pdo->prepare("SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance FROM transactions");
    $stmt->execute();
    $balance = $stmt->fetchColumn() ?: 0;

    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = LAST_INSERT_ID()");
    $stmt->execute();
    $new_transaction = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['status' => 'success', 'balance' => $balance, 'new_transaction' => $new_transaction]);
} elseif ($action == 'get_last_10') {
    $stmt = $pdo->prepare("SELECT * FROM transactions ORDER BY date DESC LIMIT 10");
    $stmt->execute();
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['transactions' => $transactions]);
} elseif ($action == 'delete') {
    $id = $_POST['id'];
    if (!isset($id) || !is_numeric($id)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
        exit;
    }
    $stmt = $pdo->prepare("DELETE FROM transactions WHERE id = ?");
    $stmt->execute([$id]);
    $affected = $stmt->rowCount();
    if ($affected === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Transaction not found']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as balance FROM transactions");
    $stmt->execute();
    $balance = $stmt->fetchColumn() ?: 0;

    echo json_encode(['status' => 'success', 'balance' => $balance]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}

ob_end_flush(); // Send output and clear buffer
?>