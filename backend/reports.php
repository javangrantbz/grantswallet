<?php
include 'db.php';
header('Content-Type: application/json');

// Weekly Transactions (Sunday to Saturday)
$stmt = $pdo->prepare("
    SELECT 
        DATE_SUB(date, INTERVAL WEEKDAY(date) DAY) as start_date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
    FROM transactions
    GROUP BY YEAR(date), WEEK(date, 0)
    ORDER BY start_date DESC
");
$stmt->execute();
$results = $stmt->fetchAll(PDO::FETCH_ASSOC);

$reports = [];
$balance = 0;
foreach ($results as $row) {
    $income = floatval($row['income']);
    $expenses = floatval($row['expenses']);
    $balance += ($income - $expenses);
    $reports[] = [
        'start_date' => $row['start_date'],
        'income' => $income,
        'expenses' => $expenses,
        'balance' => $balance
    ];
}

// Summary Totals
$total_income = array_sum(array_column($results, 'income'));
$total_expenses = array_sum(array_column($results, 'expenses'));
$total_balance = $total_income - $total_expenses;

// Category Breakdown
$stmt = $pdo->prepare("
    SELECT type, name, SUM(amount) as total
    FROM transactions
    GROUP BY type, name
    ORDER BY total DESC
");
$stmt->execute();
$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

$breakdown = ['income' => [], 'expense' => []];
foreach ($categories as $cat) {
    $breakdown[$cat['type']][] = ['name' => $cat['name'], 'total' => floatval($cat['total'])];
}

// Budget Goals
$stmt = $pdo->prepare("SELECT category, amount, period FROM budget_goals");
$stmt->execute();
$goals = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'weeks' => $reports,
    'total_income' => $total_income,
    'total_expenses' => $total_expenses,
    'total_balance' => $total_balance,
    'breakdown' => $breakdown,
    'goals' => $goals
]);
?>