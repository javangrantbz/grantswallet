// Utility functions for navigation
const fn = {
    toggleMenu: () => document.getElementById('appSplitter').right.toggle(),
    loadView: (index) => document.getElementById('appTabbar').setActiveTab(index),
    pushPage: (page) => document.getElementById('appNavigator').pushPage(page.id, { data: { title: page.title } }),
    popPage: () => document.getElementById('appNavigator').popPage()
};

// Initialize the app when pages are loaded
document.addEventListener('init', function(event) {
    const page = event.target;
    console.log('Page initialized:', page.id);
    if (page.id === 'tabbar-page' && document.getElementById('appTabbar').getActiveTabIndex() === 0) {
        updateHomePage();
    }
    if (page.id === 'reports') { // Match <ons-page id="reports">
        console.log('Reports page init - loading reports');
        updateReports();
    }
    if (page.id === 'settings.html') {
        updateSettings();
    }
    if (page.id === 'reallocate.html') {
        updateReallocateOptions();
    }
});

// Listen for tab changes to refresh Reports tab
document.addEventListener('postchange', function(event) {
    if (event.target.matches('#appTabbar')) {
        const activeIndex = event.tabItem.index;
        const activeTab = event.tabItem.getAttribute('page');
        console.log('Tab changed:', { index: activeIndex, page: activeTab });
        if (activeTab === 'reports.html') {
            console.log('Reports tab activated - refreshing');
            updateReports();
			alert(55);
        }
    }
});

// Function to update the Home Page (Grants Wallet)
function updateHomePage() {
    console.log('Updating home page');
    fetch('backend/api.php?action=get_home_data')
        .then(response => response.json())
        .then(data => {
            document.getElementById('available-income').textContent = `$${data.available_income.toFixed(2)}`;
            const expenseList = document.getElementById('expense-summary');
            expenseList.innerHTML = '';
            data.expenses.forEach(exp => {
                expenseList.innerHTML += `<ons-list-item>${exp.name}: <span>$${exp.total.toFixed(2)}</span></ons-list-item>`;
            });
        })
        .catch(error => console.error('Error updating home page:', error));
}

// Function to show Add Transaction Dialog
function showTransactionModal() {
    console.log('showAddTransactionDialog triggered');

    const dialog = ons.createElement(`
        <ons-dialog id="add-transaction-dialog" cancelable>
            <div style="text-align: center; padding: 20px; font-family: sans-serif;">
                <h2 style="margin: 0 0 20px; font-size: 1.5em;">Add Transaction</h2>
                <div id="type-selection" style="margin-bottom: 20px;">
                    <ons-button id="income-btn" modifier="large" style="width: 120px; margin: 0 10px;" onclick="selectType('Income')">
                        Income
                    </ons-button>
                    <ons-button id="expense-btn" modifier="large" style="width: 120px; margin: 0 10px;" onclick="selectType('Expense')">
                        Expense
                    </ons-button>
                </div>
                <div id="category-selection" style="display: none; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px;">Select Category</h3>
                    <div id="category-list" style="max-height: 150px; overflow-y: auto;"></div>
                </div>
                <input type="number" id="dialog-amount" placeholder="Enter amount" step="0.01" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 4px; font-size: 1em;">
                <div id="action-buttons" style="display: none;">
                    <ons-button modifier="large" style="width: 100px; margin: 0 10px;" onclick="saveTransaction()">Save</ons-button>
                    <ons-button modifier="quiet" style="width: 100px; margin: 0 10px;" onclick="document.getElementById('add-transaction-dialog').hide()">Cancel</ons-button>
                </div>
            </div>
        </ons-dialog>
    `);

    document.body.appendChild(dialog);
    dialog.show();

    window.selectType = function(type) {
        selectedType = type;
        console.log('Type selected:', type);
        document.getElementById('income-btn').style.backgroundColor = type === 'Income' ? '#4CAF50' : '';
        document.getElementById('expense-btn').style.backgroundColor = type === 'Expense' ? '#F44336' : '';
        const categorySelection = document.getElementById('category-selection');
        const actionButtons = document.getElementById('action-buttons');
        
        categorySelection.style.display = 'block';
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '<ons-list-item>Loading...</ons-list-item>';

        fetch('backend/api.php?action=get_settings')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Backend response:', data);
                categoryList.innerHTML = '';
                const items = type === 'Income' ? data.income_streams : data.expense_categories;
                if (items && items.length > 0) {
                    items.forEach(item => {
                        categoryList.innerHTML += `
                            <ons-list-item tappable onclick="selectCategory(${item.id}, '${item.name}')" style="padding: 10px;">
                                ${item.name}
                            </ons-list-item>
                        `;
                    });
                } else {
                    categoryList.innerHTML = `<ons-list-item>No ${type.toLowerCase()} categories available</ons-list-item>`;
                }
            })
            .catch(error => {
                console.error(`Error fetching ${type.toLowerCase()} categories:`, error);
                categoryList.innerHTML = `<ons-list-item>Error loading categories</ons-list-item>`;
            });
        
        actionButtons.style.display = 'block';
    };

    window.selectCategory = function(id, name) {
        selectedCategoryId = id;
        selectedCategoryName = name;
        console.log('Category selected:', { id, name });
        document.querySelectorAll('#category-list ons-list-item').forEach(item => {
            item.style.backgroundColor = item.textContent.trim() === name ? '#e0e0e0' : '';
        });
    };

    window.saveTransaction = function() {
        const amount = document.getElementById('dialog-amount').value;
        if (!selectedType || !amount) {
            ons.notification.alert('Please select a type and enter an amount.');
            return;
        }
        if (!selectedCategoryId) {
            ons.notification.alert(`Please select an ${selectedType.toLowerCase()} category.`);
            return;
        }

        const date = new Date().toISOString().split('T')[0];
        fetch('backend/api.php?action=save_transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: selectedType,
                amount: parseFloat(amount),
                category_id: selectedCategoryId,
                date: date
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Transaction saved:', data);
                document.getElementById('add-transaction-dialog').hide();
                updateHomePage();
            } else {
                console.error('Failed to save transaction:', data);
            }
        })
        .catch(error => console.error('Error saving transaction:', error));
    };
}

let selectedType = null;
let selectedCategoryId = null;
let selectedCategoryName = null;

// Function to update Reports Tab
function updateReports() {
    console.log('Fetching reports data...');
    fetch('backend/api.php?action=get_reports&t=' + new Date().getTime()) // Cache-busting
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('Reports data received:', data);

            // Update totals
            const totalIncome = document.getElementById('total-income');
            const totalExpenses = document.getElementById('total-expenses');
            const totalBalance = document.getElementById('total-balance');
            if (!totalIncome || !totalExpenses || !totalBalance) {
                console.error('Total elements not found');
                return;
            }
            totalIncome.textContent = `$${data.total_income ? data.total_income.toFixed(2) : '0.00'}`;
            totalExpenses.textContent = `$${data.total_expenses ? data.total_expenses.toFixed(2) : '0.00'}`;
            totalBalance.textContent = `$${data.total_balance ? data.total_balance.toFixed(2) : '0.00'}`;

            // Update category breakdown
            const incomeBreakdown = document.getElementById('income-breakdown');
            const expenseBreakdown = document.getElementById('expense-breakdown');
            if (!incomeBreakdown || !expenseBreakdown) {
                console.error('Breakdown elements not found');
                return;
            }
            incomeBreakdown.innerHTML = '';
            expenseBreakdown.innerHTML = '';

            if (data.breakdown && data.breakdown.income) {
                data.breakdown.income.forEach(cat => {
                    incomeBreakdown.innerHTML += `<div>${cat.name}: $${cat.total.toFixed(2)}</div>`;
                });
            } else {
                incomeBreakdown.innerHTML = '<div>No income data</div>';
            }

            if (data.breakdown && data.breakdown.expenses) {
                data.breakdown.expenses.forEach(cat => {
                    expenseBreakdown.innerHTML += `<div>${cat.name}: $${cat.total.toFixed(2)}</div>`;
                });
            } else {
                expenseBreakdown.innerHTML = '<div>No expense data</div>';
            }

            // Update weekly transactions
            const reportList = document.getElementById('report-list');
            if (!reportList) {
                console.error('Report list not found');
                return;
            }
            reportList.innerHTML = '<ons-list-header>Weekly Transactions</ons-list-header>';

            if (data.weekly_reports && data.weekly_reports.length > 0) {
                data.weekly_reports.forEach(report => {
                    const weekStart = new Date(report.week_start).toLocaleDateString();
                    reportList.innerHTML += `
                        <ons-list-item>
                            Week of ${weekStart}: 
                            Income $${report.income.toFixed(2)}, 
                            Expenses $${report.expenses.toFixed(2)}
                        </ons-list-item>
                    `;
                });
            } else {
                reportList.innerHTML += '<ons-list-item>No transactions available</ons-list-item>';
            }
        })
        .catch(error => console.error('Error updating reports:', error));
}

// Function to update Settings Tab
function updateSettings() {
    console.log('Updating settings');
    fetch('backend/api.php?action=get_settings')
        .then(response => response.json())
        .then(data => {
            const incomeList = document.getElementById('income-streams');
            incomeList.innerHTML = '';
            data.income_streams.forEach(stream => {
                incomeList.innerHTML += `<ons-list-item>${stream.name}</ons-list-item>`;
            });

            const expenseList = document.getElementById('expense-categories');
            expenseList.innerHTML = '';
            data.expense_categories.forEach(cat => {
                expenseList.innerHTML += `<ons-list-item>${cat.name}</ons-list-item>`;
            });
        })
        .catch(error => console.error('Error updating settings:', error));
}

// Function to populate Reallocate Funds options
function updateReallocateOptions() {
    console.log('Updating reallocate options');
    fetch('backend/api.php?action=get_settings')
        .then(response => response.json())
        .then(data => {
            const fromSelect = document.getElementById('from-category');
            fromSelect.innerHTML = '';
            data.expense_categories.forEach(cat => {
                fromSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        })
        .catch(error => console.error('Error loading reallocate options:', error));
}

// Function to reallocate funds
function reallocateFunds() {
    const fromCategory = document.getElementById('from-category').value;
    const amount = document.getElementById('reallocate-amount').value;

    fetch('backend/api.php?action=reallocate_funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from_category_id: fromCategory,
            amount: amount
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fn.popPage();
            updateHomePage();
        }
    })
    .catch(error => console.error('Error reallocating funds:', error));
}

// Function to add Income Stream
function addIncomeStream() {
    const name = document.getElementById('new-income').value;
    if (name) {
        fetch('backend/api.php?action=add_income_stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('new-income').value = '';
                updateSettings();
            }
        })
        .catch(error => console.error('Error adding income stream:', error));
    }
}

// Function to add Expense Category
function addExpenseCategory() {
    const name = document.getElementById('new-expense').value;
    if (name) {
        fetch('backend/api.php?action=add_expense_category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('new-expense').value = '';
                updateSettings();
            }
        })
        .catch(error => console.error('Error adding expense category:', error));
    }
}