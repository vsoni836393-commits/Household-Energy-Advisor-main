// ==========================================
// EnergyAdvisor Pro Model & Engine
// ==========================================
const SIMULATED_DATA = [
    { id: 'd1', name: "Air Conditioner (1.5 Ton)", wattage: 1500, hours: 5, monthlyUnits: 225, isDummy: true },
    { id: 'd2', name: "Refrigerator (Double Door)", wattage: 250, hours: 24, monthlyUnits: 180, isDummy: true },
    { id: 'd3', name: "Electric Geyser", wattage: 2000, hours: 1, monthlyUnits: 60, isDummy: true },
    { id: 'd4', name: "Television (LED)", wattage: 100, hours: 4, monthlyUnits: 12, isDummy: true },
    { id: 'd5', name: "Ceiling Fan", wattage: 75, hours: 10, monthlyUnits: 22.5, isDummy: true }
];

const SIMULATED_HISTORICAL = [
    { month: 'Oct', units: 210, bill: 1785 },
    { month: 'Nov', units: 195, bill: 1657 },
    { month: 'Dec', units: 250, bill: 2125 }, 
    { month: 'Jan', units: 280, bill: 2380 },
    { month: 'Feb', units: 230, bill: 1955 },
    { month: 'Mar', units: 260, bill: 2210 }
];

const TARIFF_RATE = 8.50;

const APP_STATE = {
    appliances: [...SIMULATED_DATA], // Starts loaded with demo data matching the toggle state
    historicalData: [...SIMULATED_HISTORICAL],
    trendChart: null,
    breakdownChart: null,
    savingsChart: null
};

// Appliance Presets (Wattage)
const PRESETS = {
    "Air Conditioner (1.5 Ton)": 1500,
    "Air Conditioner (2 Ton)": 2000,
    "Electric Geyser": 2000,
    "Refrigerator (Double Door)": 250,
    "Refrigerator (Single Door)": 150,
    "Washing Machine": 500,
    "Microwave Oven": 1200,
    "Television (LED)": 100,
    "Desktop Computer": 250,
    "Ceiling Fan": 75,
    "LED Tube Light": 20
};

// Advanced Tips Database
const TIPS_DB = {
    'Air Conditioner': { tip: 'Set AC to 24°C instead of 18°C. Every degree saves ~5% power.', factor: 0.15 },
    'Geyser': { tip: 'Turn on geyser only 30 mins before use. Avoid leaving it idle.', factor: 0.20 },
    'Refrigerator': { tip: 'Ensure door seals are tight and keep it properly defrosted.', factor: 0.10 },
    'Washing Machine': { tip: 'Run full loads and use cold water cycles when possible.', factor: 0.15 },
    'Microwave': { tip: 'Do not leave on standby mode; unplug when not in use.', factor: 0.05 },
    'Television': { tip: 'Reduce backlight brightness and enable sleep timers.', factor: 0.10 },
    'Computer': { tip: 'Enable power-saving features that put the monitor to sleep.', factor: 0.15 },
    'Fan': { tip: 'Use BLDC fans to save up to 60% relative to standard fans.', factor: 0.10 },
    'Light': { tip: 'Ensure you are using LED instead of incandescent. Turn off when leaving room.', factor: 0.10 },
    'Default': { tip: 'Reduce usage time by tweaking optimal scheduling.', factor: 0.10 }
};

// Core Functions
function calculateApplianceUnits(wattage, hours) {
    return (wattage * hours * 30) / 1000;
}

function predictNextBill(historicalData) {
    if (historicalData.length === 0) return { predictedUnits: 0, predictedBill: 0 };
    let sumUnits = 0;
    historicalData.forEach(data => sumUnits += data.units);
    const avgUnits = sumUnits / historicalData.length;
    return {
        predictedUnits: avgUnits,
        predictedBill: avgUnits * TARIFF_RATE
    };
}

function matchTip(applianceName) {
    const nameLower = applianceName.toLowerCase();
    for (let key in TIPS_DB) {
        if (nameLower.includes(key.toLowerCase())) {
            return TIPS_DB[key];
        }
    }
    return TIPS_DB['Default'];
}

// ==========================================
// DOM Initialization & Event Listeners
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initCharts();
    updateUI();
    
    // Simulate premium AI payload boot-up animation
    setTimeout(() => {
        const loader = document.getElementById('loadingScreen');
        if(loader) {
            loader.classList.add('hidden');
            // Hard delete from DOM after CSS fade transition (600ms) to free memory
            setTimeout(() => loader.remove(), 600);
        }
    }, 1600);

    // Select Appliance Change Event
    document.getElementById('appName').addEventListener('change', (e) => {
        const val = e.target.value;
        const customGroup = document.getElementById('customNameGroup');
        const customInput = document.getElementById('customAppName');
        const wattageInput = document.getElementById('appWattage');
        
        if (val === 'Custom') {
            customGroup.style.display = 'block';
            customInput.required = true;
            wattageInput.value = '';
        } else {
            customGroup.style.display = 'none';
            customInput.required = false;
            wattageInput.value = PRESETS[val] || '';
        }
    });

    // Add Appliance Form Submit
    document.getElementById('applianceForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectVal = document.getElementById('appName').value;
        const customVal = document.getElementById('customAppName').value;
        
        const finalName = selectVal === 'Custom' ? customVal : selectVal;
        const wattage = parseFloat(document.getElementById('appWattage').value);
        const hours = parseFloat(document.getElementById('appHours').value);
        
        const monthlyUnits = calculateApplianceUnits(wattage, hours);
        
        APP_STATE.appliances.push({
            id: Date.now(),
            name: finalName,
            wattage,
            hours,
            monthlyUnits,
            isDummy: false
        });
        
        // Reset specifics but keep nice flow
        document.getElementById('appWattage').value = '';
        document.getElementById('appHours').value = '';
        document.getElementById('appName').value = '';
        document.getElementById('customNameGroup').style.display = 'none';

        updateUI();
    });

    // Demo Data Toggle
    const demoToggle = document.getElementById('demoToggleCheck');
    if (demoToggle) {
        demoToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                // Determine if dummies are currently loaded
                const hasDummies = APP_STATE.appliances.some(a => a.isDummy);
                if (!hasDummies) {
                    APP_STATE.appliances.push(...SIMULATED_DATA);
                    // Also restore historical data graph
                    if (APP_STATE.historicalData.length === 0) {
                        APP_STATE.historicalData = [...SIMULATED_HISTORICAL];
                    }
                    updateUI();
                }
            } else {
                // Filter out all dummy data, leaving user data
                APP_STATE.appliances = APP_STATE.appliances.filter(a => !a.isDummy);
                // Wipe historical graph pattern
                APP_STATE.historicalData = [];
                updateUI();
            }
        });
    }

    // What If Simulator Handlers
    const whatIfTarget = document.getElementById('whatIfTarget');
    const whatIfSlider = document.getElementById('whatIfReduce');
    const reduceValDisplay = document.getElementById('reduceValDisplay');

    whatIfSlider.addEventListener('input', (e) => {
        reduceValDisplay.textContent = parseFloat(e.target.value).toFixed(1);
        runSimulator();
    });

    whatIfTarget.addEventListener('change', () => {
        runSimulator();
    });
});

// ==========================================
// UI & Chart Updaters
// ==========================================
function updateUI() {
    const totalUnits = APP_STATE.appliances.reduce((sum, app) => sum + app.monthlyUnits, 0);
    const totalBill = totalUnits * TARIFF_RATE;
    
    // KPI Cards
    document.getElementById('totalUnitsKpi').innerHTML = `${totalUnits.toFixed(0)} <span class="unit">kWh</span>`;
    document.getElementById('totalBillKpi').textContent = `₹${totalBill.toFixed(0)}`;
    
    const prediction = predictNextBill(APP_STATE.historicalData);
    const displayPrediction = Math.max(prediction.predictedBill, totalBill);
    document.getElementById('predictedBillKpi').textContent = `₹${displayPrediction.toFixed(0)}`;

    // Update Appliance List Let's
    const appList = document.getElementById('applianceList');
    const listHeaders = document.getElementById('listHeaders');
    const emptyState = document.getElementById('emptyState');
    
    appList.innerHTML = '';
    
    if (APP_STATE.appliances.length > 0) {
        listHeaders.style.display = 'flex';
        emptyState.style.display = 'none';
        
        APP_STATE.appliances.forEach(app => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="app-details">
                    <span class="app-name-p">${app.name}</span>
                    <span class="app-stats-p">🔋 ${app.wattage}W | ⏱ ${app.hours} hrs/day</span>
                </div>
                <div style="text-align: right;">
                    <b style="font-size: 1.1rem; color: #38bdf8;">${app.monthlyUnits.toFixed(1)}</b> <span class="unit">kWh</span>
                </div>
            `;
            appList.appendChild(li);
        });
    } else {
        listHeaders.style.display = 'none';
        emptyState.style.display = 'block';
    }

    // Top Consumers
    const topAppliances = [...APP_STATE.appliances].sort((a,b) => b.monthlyUnits - a.monthlyUnits).slice(0,3);
    const topList = document.getElementById('topConsumersList');
    topList.innerHTML = '';
    
    if(topAppliances.length === 0) {
        topList.innerHTML = '<p class="empty-list-msg">Waiting for appliances...</p>';
    } else {
        topAppliances.forEach(app => {
            const pct = ((app.monthlyUnits / totalUnits) * 100).toFixed(0);
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="app-name-p">${app.name}</span>
                <span style="font-weight: 700;">${app.monthlyUnits.toFixed(1)} kWh <span style="color:#94a3b8; font-size:0.8rem;">(${pct}%)</span></span>
            `;
            topList.appendChild(li);
        });
    }

    // Suggestions
    const sugList = document.getElementById('suggestionsList');
    sugList.innerHTML = '';
    
    if(topAppliances.length === 0) {
        sugList.innerHTML = '<p class="empty-list-msg">Waiting for appliances...</p>';
    } else {
        topAppliances.forEach(app => {
            const rule = matchTip(app.name);
            const savingsRs = (app.monthlyUnits * rule.factor) * TARIFF_RATE;
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="sug-title"><b>${app.name}:</b> ${rule.tip}</span>
                <span class="sug-saving">Expected Saving: ₹${savingsRs.toFixed(0)} / mo</span>
            `;
            sugList.appendChild(li);
        });
    }

    // Update Dropdown for What If Simulator
    updateSimulatorDropdown();
    
    // Update Charts
    updateCharts(totalUnits);
}

function updateSimulatorDropdown() {
    const select = document.getElementById('whatIfTarget');
    const currentVal = select.value;
    select.innerHTML = '<option value="" disabled selected>Select an appliance...</option>';
    
    APP_STATE.appliances.forEach(app => {
        const opt = document.createElement('option');
        opt.value = app.id;
        opt.textContent = app.name;
        select.appendChild(opt);
    });

    if(currentVal && APP_STATE.appliances.find(a => a.id == currentVal)) {
        select.value = currentVal;
    }
}

function runSimulator() {
    const targetId = document.getElementById('whatIfTarget').value;
    const reduceHours = parseFloat(document.getElementById('whatIfReduce').value);
    const resultBox = document.getElementById('whatIfResult');
    
    if (!targetId) return;

    const targetAppliance = APP_STATE.appliances.find(a => a.id == targetId);
    if(targetAppliance) {
        if(reduceHours >= targetAppliance.hours) {
            resultBox.innerHTML = `<b>Cannot reduce more hours than the appliance runs (${targetAppliance.hours} hrs)!</b>`;
        } else {
            const unitsSaved = calculateApplianceUnits(targetAppliance.wattage, reduceHours);
            const rsSaved = unitsSaved * TARIFF_RATE;
            resultBox.innerHTML = `By turning off the <b>${targetAppliance.name}</b> for an extra ${reduceHours} hrs/day:<br>
            You avoid generating <b>${unitsSaved.toFixed(1)} kWh</b>.<br>
            Total Savings: <b>₹${rsSaved.toFixed(2)} per month</b>🚀`;
        }
        resultBox.classList.remove('hidden');
    }
}

// ==========================================
// Chart.js Implementations
// ==========================================
function initCharts() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. Trend Chart
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    
    // Create Premium Gradient Fill
    let gradientFill = ctxTrend.createLinearGradient(0, 0, 0, 350);
    gradientFill.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    gradientFill.addColorStop(1, 'rgba(56, 189, 248, 0.01)');

    APP_STATE.trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Units (kWh)',
                data: [],
                borderColor: '#38bdf8',
                backgroundColor: gradientFill,
                borderWidth: 3,
                pointBackgroundColor: '#0f172a',
                pointBorderColor: '#38bdf8',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.4 // Smooth bezier curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#38bdf8',
                    padding: 14,
                    borderColor: 'rgba(56, 189, 248, 0.2)',
                    borderWidth: 1,
                    displayColors: false
                }
            },
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { color: '#94a3b8' }
                },
                x: { 
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // 2. Breakdown Pie Chart
    const ctxPie = document.getElementById('breakdownChart').getContext('2d');
    APP_STATE.breakdownChart = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: ['#f43f5e', '#f59e0b', '#38bdf8', '#10b981', '#8b5cf6', '#ec4899', '#64748b'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { color: '#e2e8f0', padding: 15, boxWidth: 12, usePointStyle: true } 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${context.raw.toFixed(1)} kWh`;
                        }
                    }
                }
            }
        }
    });

    // 3. Savings Potential Bar Chart
    const ctxBar = document.getElementById('savingsBarChart').getContext('2d');
    
    // Colorful array mapping for bars
    const barColors = ['#10b981', '#38bdf8', '#8b5cf6', '#f59e0b', '#f43f5e', '#ec4899'];

    APP_STATE.savingsChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Potential Savings',
                data: [],
                backgroundColor: barColors.map(c => c + 'aa'), // add transparency
                borderColor: barColors,
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#f8fafc',
                    bodyColor: '#10b981',
                    padding: 12,
                    borderColor: 'rgba(16, 185, 129, 0.2)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return ` Saves ₹${context.raw.toFixed(0)} / mo`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                    ticks: { 
                        color: '#94a3b8',
                        callback: function(value) { return '₹' + value; }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });
}

function updateCharts(currentTotalUnits) {
    if(!APP_STATE.trendChart || !APP_STATE.breakdownChart) return;

    // --- Update Trend Chart ---
    const labels = APP_STATE.historicalData.map(d => d.month);
    const data = APP_STATE.historicalData.map(d => d.units);

    if (APP_STATE.appliances.length > 0) {
        labels.push('Est. Now');
        data.push(currentTotalUnits);
    }
    
    if (APP_STATE.historicalData.length > 0) {
        const prediction = predictNextBill(APP_STATE.historicalData);
        labels.push('Next (Pred.)');
        data.push(prediction.predictedUnits);
    }

    APP_STATE.trendChart.data.labels = labels;
    APP_STATE.trendChart.data.datasets[0].data = data;
    APP_STATE.trendChart.update();

    // --- Update Pie Chart and Bar Chart ---
    const pieEmpty = document.getElementById('pieEmptyState');
    const barEmpty = document.getElementById('barEmptyState');
    
    if (APP_STATE.appliances.length > 0) {
        if(pieEmpty) pieEmpty.style.display = 'none';
        if(barEmpty) barEmpty.style.display = 'none';
        
        const aggregatedUnits = {};
        const aggregatedSavings = {};

        APP_STATE.appliances.forEach(a => {
            aggregatedUnits[a.name] = (aggregatedUnits[a.name] || 0) + a.monthlyUnits;
            
            const rule = matchTip(a.name);
            const savingsRs = (a.monthlyUnits * rule.factor) * TARIFF_RATE;
            aggregatedSavings[a.name] = (aggregatedSavings[a.name] || 0) + savingsRs;
        });

        const labelsUnits = Object.keys(aggregatedUnits);
        const labelsSavings = Object.keys(aggregatedSavings);
        
        // Generate repeating color palettes based on dataset size
        const palette = ['#10b981', '#38bdf8', '#8b5cf6', '#f59e0b', '#f43f5e', '#ec4899', '#64748b'];
        const getColors = (len) => Array.from({length: len}, (_, i) => palette[i % palette.length]);

        // Pie Chart
        APP_STATE.breakdownChart.data.labels = labelsUnits;
        APP_STATE.breakdownChart.data.datasets[0].data = Object.values(aggregatedUnits);
        APP_STATE.breakdownChart.data.datasets[0].backgroundColor = getColors(labelsUnits.length);

        // Bar Chart
        const barColArr = getColors(labelsSavings.length);
        APP_STATE.savingsChart.data.labels = labelsSavings;
        APP_STATE.savingsChart.data.datasets[0].data = Object.values(aggregatedSavings);
        APP_STATE.savingsChart.data.datasets[0].backgroundColor = barColArr.map(c => c + 'aa');
        APP_STATE.savingsChart.data.datasets[0].borderColor = barColArr;
    } else {
        if(pieEmpty) pieEmpty.style.display = 'block';
        if(barEmpty) barEmpty.style.display = 'block';
        
        APP_STATE.breakdownChart.data.labels = [];
        APP_STATE.breakdownChart.data.datasets[0].data = [];
        
        APP_STATE.savingsChart.data.labels = [];
        APP_STATE.savingsChart.data.datasets[0].data = [];
    }
    APP_STATE.breakdownChart.update();
    APP_STATE.savingsChart.update();
}
