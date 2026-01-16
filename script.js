// Dữ liệu ứng dụng
let transactions = JSON.parse(localStorage.getItem('fundTransactions')) || [];
let events = JSON.parse(localStorage.getItem('fundEvents')) || [];
let sourceChart = null;
let expenseChart = null;

// Hàm tiện ích
const getToday = () => new Date().toISOString().split('T')[0];
const formatCurrency = amount => amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
const formatDate = dateStr => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// Lấy giá trị số từ chuỗi định dạng
const extractNumber = str => parseInt(str.replace(/\D/g, '')) || 0;

// Toggle hiển thị phần tử
const toggleElement = (id, show) => document.getElementById(id)?.classList.toggle('hidden', !show);

 
document.addEventListener('DOMContentLoaded', function() {
    // Định dạng tiền tệ khi nhập
    ['amount', 'estimated-cost', 'advance-money', 'actual-cost'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', e => {
                let value = extractNumber(e.target.value);
                e.target.value = value ? formatCurrency(value) : '';
            });
        }
    });
    
    // Tính tổng tiền dự kiến cho sự kiện
    const quantityInput = document.getElementById('item-quantity');
    const estimatedCost = document.getElementById('estimated-cost');
    const totalEstimated = document.getElementById('total-estimated');
    
    const calculateTotal = () => {
        const quantity = parseInt(quantityInput.value) || 0;
        const cost = extractNumber(estimatedCost.value);
        const total = quantity * cost;
        totalEstimated.value = total > 0 ? formatCurrency(total) : '';
    };
    
    if (quantityInput && estimatedCost && totalEstimated) {
        quantityInput.addEventListener('input', calculateTotal);
        estimatedCost.addEventListener('input', calculateTotal);
    }
    
    // Hiển thị ngày hiện tại mặc định
    const today = getToday();
    document.getElementById('transaction-date').value = today;
    document.getElementById('event-date').value = today;
    
    // Khởi tạo giao diện
    updateDashboard();
    loadTransactionHistory();
    loadEventTable();
    checkLowFundWarning();
    initializeCharts();
});
        
// Xử lý chuyển tab
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
        if (tabId === 'dashboard') updateCharts();
    });
});
        
// Xử lý hiển thị/ẩn các trường theo loại giao dịch
const resetTransactionFields = () => {
    ['income-type-group', 'birthday-person-group', 'other-income-group', 'other-expense-group']
        .forEach(id => toggleElement(id, false));
    ['income-type', 'expense-type', 'birthday-person', 'other-income', 'other-expense']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
};

document.querySelectorAll('input[name="type"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const isIncome = this.value === 'income';
        toggleElement('income-type-group', isIncome);
        toggleElement('expense-type-group', !isIncome);
        resetTransactionFields();
    });
});

// Xử lý hiển thị trường theo loại chi/thu
document.getElementById('expense-type').addEventListener('change', function() {
    toggleElement('birthday-person-group', this.value === 'sinh-nhat');
    toggleElement('other-expense-group', this.value === 'other-expense');
});

document.getElementById('income-type').addEventListener('change', function() {
    toggleElement('other-income-group', this.value === 'other-income');
});
        
// Xác định loại thu/chi
const getCategory = type => {
    if (type === 'income') {
        const incomeType = document.getElementById('income-type').value;
        if (incomeType === 'other-income') return document.getElementById('other-income').value || 'Thu khác';
        return document.querySelector(`#income-type option[value="${incomeType}"]`)?.textContent || '';
    } else {
        const expenseType = document.getElementById('expense-type').value;
        if (expenseType === 'other-expense') return document.getElementById('other-expense').value || 'Chi khác';
        if (expenseType === 'sinh-nhat') {
            const person = document.getElementById('birthday-person').value;
            return person ? `Sinh nhật ${person}` : '';
        }
        return document.querySelector(`#expense-type option[value="${expenseType}"]`)?.textContent || '';
    }
};

// Lấy giá trị form
const getFormValue = (id, isNumber = false) => {
    const el = document.getElementById(id);
    if (!el) return '';
    const value = el.value;
    return isNumber ? extractNumber(value) : value;
};

// Xử lý form thêm giao dịch
document.getElementById('transaction-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const transaction = {
        id: Date.now(),
        date: getFormValue('transaction-date'),
        type: document.querySelector('input[name="type"]:checked').value,
        amount: getFormValue('amount', true),
        source: getFormValue('source'),
        category: getCategory(document.querySelector('input[name="type"]:checked').value),
        member: getFormValue('member'),
        description: getFormValue('description')
    };
    
    transactions.push(transaction);
    localStorage.setItem('fundTransactions', JSON.stringify(transactions));
    
    updateDashboard();
    loadTransactionHistory();
    checkLowFundWarning();
    
    alert('Đã lưu giao dịch thành công!');
    this.reset();
    document.getElementById('transaction-date').value = getToday();
    
    // Reset trường ẩn
    toggleElement('income-type-group', true);
    toggleElement('expense-type-group', false);
    resetTransactionFields();
});
        
// Xử lý form thêm sự kiện
document.getElementById('event-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const estimatedCost = getFormValue('estimated-cost', true);
    const quantity = parseInt(getFormValue('item-quantity')) || 0;
    
    const event = {
        id: Date.now(),
        eventType: getFormValue('event-type'),
        eventDate: getFormValue('event-date'),
        itemName: getFormValue('item-name'),
        quantity: quantity,
        estimatedCost: estimatedCost,
        totalEstimated: quantity * estimatedCost,
        buyer: getFormValue('event-buyer'),
        advanceMoney: getFormValue('advance-money', true),
        actualCost: getFormValue('actual-cost', true),
        paymentStatus: getFormValue('payment-status')
    };
    
    events.push(event);
    localStorage.setItem('fundEvents', JSON.stringify(events));
    loadEventTable();
    
    alert('Đã lưu kế hoạch sự kiện thành công!');
    this.reset();
    document.getElementById('event-date').value = getToday();
    document.getElementById('item-quantity').value = 1;
    document.getElementById('total-estimated').value = '';
});
        
// Cập nhật dashboard
function updateDashboard() {
    let totalIncome = 0, totalExpense = 0;
    
    transactions.forEach(t => {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });
    
    const balance = totalIncome - totalExpense;
    
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('current-fund').textContent = formatCurrency(balance);
    
    updateCharts();
}
        
        // Khởi tạo biểu đồ
        function initializeCharts() {
            const sourceCtx = document.getElementById('sourceChart').getContext('2d');
            const expenseCtx = document.getElementById('expenseChart').getContext('2d');
            
            // Biểu đồ tỷ lệ thu/chi theo nguồn
            sourceChart = new Chart(sourceCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Tiền mặt (Thu)', 'Momo (Thu)', 'Tiền mặt (Chi)', 'Momo (Chi)'],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: [
                            '#4caf50',
                            '#2196f3',
                            '#f44336',
                            '#ff9800'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });
            
            // Biểu đồ top 5 loại chi
            expenseChart = new Chart(expenseCtx, {
                type: 'bar',
                data: {
                    labels: ['', '', '', '', ''],
                    datasets: [{
                        label: 'Số tiền (đ)',
                        data: [0, 0, 0, 0, 0],
                        backgroundColor: '#f44336',
                        borderColor: '#d32f2f',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });
            
            // Cập nhật dữ liệu biểu đồ
            updateCharts();
        }
        
// Cập nhật dữ liệu biểu đồ
function updateCharts() {
    if (!sourceChart || !expenseChart) return;
    
    let cashIncome = 0, momoIncome = 0, cashExpense = 0, momoExpense = 0;
    let expenseByCategory = {};
    
    transactions.forEach(t => {
        if (t.type === 'income') {
            if (t.source === 'cash') cashIncome += t.amount;
            else if (t.source === 'momo') momoIncome += t.amount;
        } else {
            if (t.source === 'cash') cashExpense += t.amount;
            else if (t.source === 'momo') momoExpense += t.amount;
            
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        }
    });
    
    sourceChart.data.datasets[0].data = [cashIncome, momoIncome, cashExpense, momoExpense];
    sourceChart.update();
    
    const sorted = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
    expenseChart.data.labels = sorted.map(item => item[0]);
    expenseChart.data.datasets[0].data = sorted.map(item => item[1]);
    expenseChart.update();
}
        
// Tải lịch sử giao dịch
function loadTransactionHistory() {
    const tbody = document.getElementById('transaction-table-body');
    const noData = document.getElementById('no-transaction-data');
    const table = document.getElementById('transaction-table');
    
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        noData.classList.remove('hidden');
        table.classList.add('hidden');
        return;
    }
    
    noData.classList.add('hidden');
    table.classList.remove('hidden');
    
    const typeFilter = document.getElementById('filter-type').value;
    const sourceFilter = document.getElementById('filter-source').value;
    const memberFilter = document.getElementById('filter-member').value;
    
    const filtered = transactions.filter(t => 
        (typeFilter === 'all' || t.type === typeFilter) &&
        (sourceFilter === 'all' || t.source === sourceFilter) &&
        (memberFilter === 'all' || t.member === memberFilter)
    );
    
    filtered.forEach((t, i) => {
        const row = document.createElement('tr');
        row.className = t.type === 'income' ? 'income-row' : 'expense-row';
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${formatDate(t.date)}</td>
            <td><span class="badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type === 'income' ? 'Thu' : 'Chi'}</span></td>
            <td>${formatCurrency(t.amount)}</td>
            <td><span class="badge badge-source">${t.source === 'cash' ? 'Tiền mặt' : 'Momo'}</span></td>
            <td>${t.category}</td>
            <td>${t.member}</td>
            <td>${t.description || '-'}</td>
            <td><button class="delete-btn" onclick="deleteTransaction(${t.id})"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(row);
    });
}
        
// Tải bảng sự kiện
function loadEventTable() {
    const tbody = document.getElementById('event-table-body');
    const noData = document.getElementById('no-event-data');
    const table = document.getElementById('event-table');
    
    tbody.innerHTML = '';
    
    if (events.length === 0) {
        noData.classList.remove('hidden');
        table.classList.add('hidden');
        return;
    }
    
    noData.classList.add('hidden');
    table.classList.remove('hidden');
    
    const statusMap = {
        pending: { text: 'Chưa thanh toán', class: 'badge-expense' },
        partial: { text: 'Thanh toán một phần', class: 'badge-source' },
        completed: { text: 'Đã thanh toán đủ', class: 'badge-income' }
    };
    
    events.forEach((e, i) => {
        const status = statusMap[e.paymentStatus] || statusMap.pending;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${e.eventType}<br><small>${formatDate(e.eventDate)}</small></td>
            <td>${e.itemName}</td>
            <td>${e.quantity}</td>
            <td>${formatCurrency(e.totalEstimated)}</td>
            <td>${e.buyer}</td>
            <td>${e.actualCost > 0 ? formatCurrency(e.actualCost) : 'Chưa cập nhật'}</td>
            <td><span class="badge ${status.class}">${status.text}</span></td>
            <td><button class="delete-btn" onclick="deleteEvent(${e.id})"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(row);
    });
}
        
// Xóa giao dịch
function deleteTransaction(id) {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('fundTransactions', JSON.stringify(transactions));
        updateDashboard();
        loadTransactionHistory();
        checkLowFundWarning();
    }
}

// Xóa sự kiện
function deleteEvent(id) {
    if (confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
        events = events.filter(e => e.id !== id);
        localStorage.setItem('fundEvents', JSON.stringify(events));
        loadEventTable();
    }
}
        
// Kiểm tra cảnh báo quỹ thấp
function checkLowFundWarning() {
    let totalIncome = 0, totalExpense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });
    const balance = totalIncome - totalExpense;
    toggleElement('low-fund-warning', balance < 500000);
}
        
// Định dạng ngày tháng
 
        
        // Thêm bộ lọc cho lịch sử giao dịch
        document.getElementById('filter-type').addEventListener('change', loadTransactionHistory);
        document.getElementById('filter-source').addEventListener('change', loadTransactionHistory);
        document.getElementById('filter-member').addEventListener('change', loadTransactionHistory);
        
        // Reset form giao dịch
        document.getElementById('reset-form').addEventListener('click', function() {
            toggleElement('income-type-group', true);
            toggleElement('expense-type-group', false);
            resetTransactionFields();
            document.getElementById('transaction-date').value = getToday();
        });
        
        // Reset form sự kiện
        document.getElementById('reset-event-form').addEventListener('click', function() {
            document.getElementById('event-date').value = getToday();
            document.getElementById('item-quantity').value = 1;
            document.getElementById('total-estimated').value = '';
        });