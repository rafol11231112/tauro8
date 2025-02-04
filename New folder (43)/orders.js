document.addEventListener('DOMContentLoaded', function() {
    // Sample orders data
    const orders = [
        { id: '#1234', product: 'OTP Bot', customer: 'john@example.com', date: '2024-03-10', status: 'Completed', amount: '$18.99' },
        { id: '#1235', product: 'SMS Bot', customer: 'jane@example.com', date: '2024-03-10', status: 'Pending', amount: '$24.99' },
        { id: '#1236', product: 'OTP Bot', customer: 'mike@example.com', date: '2024-03-09', status: 'Completed', amount: '$18.99' },
        { id: '#1237', product: 'SMS Bot', customer: 'sarah@example.com', date: '2024-03-09', status: 'Completed', amount: '$24.99' },
        { id: '#1238', product: 'OTP Bot', customer: 'alex@example.com', date: '2024-03-08', status: 'Pending', amount: '$18.99' },
    ];

    // Initialize graph
    initGraph();

    // Orders table functionality
    const tableBody = document.getElementById('ordersTableBody');
    const searchInput = document.querySelector('.search-input');
    const filterSelect = document.querySelector('.filter-select');

    function displayOrders(ordersToShow) {
        tableBody.innerHTML = ordersToShow.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.product}</td>
                <td>${order.customer}</td>
                <td>${order.date}</td>
                <td><span class="status ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>${order.amount}</td>
            </tr>
        `).join('');
    }

    function filterOrders() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;

        const filteredOrders = orders.filter(order => {
            const matchesSearch = Object.values(order).some(value => 
                value.toString().toLowerCase().includes(searchTerm)
            );
            const matchesFilter = filterValue === 'all' || 
                order.status.toLowerCase() === filterValue;

            return matchesSearch && matchesFilter;
        });

        displayOrders(filteredOrders);
    }

    // Event listeners for orders table
    searchInput.addEventListener('input', filterOrders);
    filterSelect.addEventListener('change', filterOrders);

    // Initial orders display
    displayOrders(orders);
});

// Graph functionality
function initGraph() {
    const timeRangeSelect = document.getElementById('timeRange');
    const graphBars = document.querySelector('.graph-bars');
    const xAxis = document.querySelector('.x-axis');
    const yAxis = document.querySelector('.y-axis');
    const graphGrid = document.querySelector('.graph-grid');

    function updateGraph(days) {
        // Generate sample data
        const data = Array.from({length: days}, (_, i) => ({
            date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000),
            value: Math.floor(Math.random() * 2000) + 500
        }));

        const maxValue = Math.max(...data.map(d => d.value));

        // Clear previous content
        graphBars.innerHTML = '';
        xAxis.innerHTML = '';
        yAxis.innerHTML = '';
        graphGrid.innerHTML = '';

        // Add grid lines and y-axis labels
        for (let i = 5; i >= 0; i--) {
            const value = maxValue * i / 5;
            
            // Add grid line
            const gridLine = document.createElement('div');
            gridLine.className = 'grid-line';
            graphGrid.appendChild(gridLine);
            
            // Add y-axis label
            const label = document.createElement('div');
            label.textContent = `$${Math.floor(value).toLocaleString()}`;
            yAxis.appendChild(label);
        }

        // Add bars and x-axis labels
        data.forEach(item => {
            // Create bar
            const bar = document.createElement('div');
            bar.className = 'bar';
            const height = (item.value / maxValue) * 100;
            bar.style.height = `${height}%`;
            bar.title = `$${item.value.toLocaleString()}`;
            graphBars.appendChild(bar);

            // Add x-axis label
            const label = document.createElement('div');
            label.className = 'x-axis-label';
            label.textContent = item.date.toLocaleDateString('en-US', { weekday: 'short' });
            xAxis.appendChild(label);
        });
    }

    // Initial graph
    updateGraph(7);

    // Handle time range changes
    timeRangeSelect.addEventListener('change', (e) => {
        const days = e.target.value === 'week' ? 7 : e.target.value === 'month' ? 30 : 12;
        updateGraph(days);
    });
} 