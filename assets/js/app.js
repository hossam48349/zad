// ===================================
// STATE MANAGEMENT
// ===================================
let state = {
    plan: null,
    logs: [],
    theme: 'light',
    achievements: [],
    streak: 0,
    longestStreak: 0
};

const ACHIEVEMENTS = [
    { id: 'first_read', title: 'البداية', desc: 'سجل أول قراءة', icon: '🌟', requirement: 1 },
    { id: 'five_parts', title: 'المثابر', desc: 'اقرأ 5 أجزاء', icon: '📖', requirement: 5 },
    { id: 'ten_parts', title: 'المجتهد', desc: 'اقرأ 10 أجزاء', icon: '📚', requirement: 10 },
    { id: 'half_quran', title: 'نصف الطريق', desc: 'اقرأ 15 جزء', icon: '⭐', requirement: 15 },
    { id: 'complete_quran', title: 'الختمة', desc: 'أتمم ختم القرآن', icon: '🏆', requirement: 30 },
    { id: 'week_streak', title: 'أسبوع متواصل', desc: 'اقرأ 7 أيام متتالية', icon: '🔥', requirement: 7, type: 'streak' },
    { id: 'month_streak', title: 'شهر متواصل', desc: 'اقرأ 30 يوم متتالي', icon: '💎', requirement: 30, type: 'streak' }
];

// ===================================
// INITIALIZATION
// ===================================
function init() {
    loadState();
    setupEventListeners();
    calculateStreak();
    renderUI();
    renderLogs();
    renderAchievements();
    renderWeeklyChart();
    setCurrentYear();
    applyTheme();
}

// ===================================
// LOCAL STORAGE
// ===================================
function loadState() {
    const savedPlan = localStorage.getItem('plan');
    const savedLogs = localStorage.getItem('logs');
    const savedTheme = localStorage.getItem('theme');
    const savedAchievements = localStorage.getItem('achievements');
    const savedStreak = localStorage.getItem('streak');
    const savedLongestStreak = localStorage.getItem('longestStreak');
    
    if (savedPlan) {
        state.plan = JSON.parse(savedPlan);
    }
    
    if (savedLogs) {
        state.logs = JSON.parse(savedLogs);
    }
    
    if (savedTheme) {
        state.theme = savedTheme;
    }
    
    if (savedAchievements) {
        state.achievements = JSON.parse(savedAchievements);
    }
    
    if (savedStreak) {
        state.streak = parseInt(savedStreak);
    }
    
    if (savedLongestStreak) {
        state.longestStreak = parseInt(savedLongestStreak);
    }
}

function saveState() {
    if (state.plan) {
        localStorage.setItem('plan', JSON.stringify(state.plan));
    }
    localStorage.setItem('logs', JSON.stringify(state.logs));
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('achievements', JSON.stringify(state.achievements));
    localStorage.setItem('streak', state.streak.toString());
    localStorage.setItem('longestStreak', state.longestStreak.toString());
}

// ===================================
// EVENT LISTENERS
// ===================================
function setupEventListeners() {
    // Goal type change
    document.getElementById('goalType').addEventListener('change', handleGoalTypeChange);
    
    // Ramadan mode toggle
    document.getElementById('ramadanMode').addEventListener('change', handleRamadanModeChange);
    
    // Save plan
    document.getElementById('savePlanBtn').addEventListener('click', savePlan);
    
    // Add reading
    document.getElementById('addReadingBtn').addEventListener('click', addReading);
    
    // Reading input enter key
    document.getElementById('readingInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !document.getElementById('addReadingBtn').disabled) {
            addReading();
        }
    });
    
    // Quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseFloat(btn.dataset.amount);
            quickAddReading(amount);
        });
    });
    
    // Search logs
    document.getElementById('searchLogs').addEventListener('input', filterLogs);
    
    // Filter logs
    document.getElementById('filterLogs').addEventListener('change', filterLogs);
    
    // Clear logs
    document.getElementById('clearLogsBtn').addEventListener('click', clearAllLogs);
    
    // Reset plan
    document.getElementById('resetBtn').addEventListener('click', resetPlan);
    
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Export data
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // Event delegation for delete buttons
    document.getElementById('logsTableBody').addEventListener('click', (e) => {
        if (e.target.closest('.delete-log-btn')) {
            const index = parseInt(e.target.closest('.delete-log-btn').dataset.index);
            deleteLog(index);
        }
    });
}

// ===================================
// PLAN MANAGEMENT
// ===================================
function handleGoalTypeChange(e) {
    const customTargetGroup = document.getElementById('customTargetGroup');
    const targetPartsInput = document.getElementById('targetPartsInput');
    
    if (e.target.value === 'custom') {
        customTargetGroup.style.display = 'block';
        targetPartsInput.required = true;
    } else {
        customTargetGroup.style.display = 'none';
        targetPartsInput.required = false;
        targetPartsInput.value = '';
    }
}

function handleRamadanModeChange(e) {
    const ramadanEndGroup = document.getElementById('ramadanEndGroup');
    const daysInput = document.getElementById('daysInput');
    const ramadanEndDate = document.getElementById('ramadanEndDate');
    
    if (e.target.checked) {
        ramadanEndGroup.style.display = 'block';
        daysInput.disabled = true;
        ramadanEndDate.required = true;
        
        // Set default Ramadan end date (example: 30 days from now)
        const defaultEnd = new Date();
        defaultEnd.setDate(defaultEnd.getDate() + 30);
        ramadanEndDate.value = defaultEnd.toISOString().split('T')[0];
        
        // Calculate days automatically
        calculateRamadanDays();
    } else {
        ramadanEndGroup.style.display = 'none';
        daysInput.disabled = false;
        ramadanEndDate.required = false;
        daysInput.value = '';
    }
}

function calculateRamadanDays() {
    const ramadanEndDate = document.getElementById('ramadanEndDate').value;
    if (!ramadanEndDate) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(ramadanEndDate);
    endDate.setHours(0, 0, 0, 0);
    
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    document.getElementById('daysInput').value = Math.max(1, diffDays);
}

// Update days when Ramadan end date changes
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('ramadanEndDate').addEventListener('change', calculateRamadanDays);
});

function savePlan() {
    const goalType = document.getElementById('goalType').value;
    const daysInput = document.getElementById('daysInput');
    const targetPartsInput = document.getElementById('targetPartsInput');
    const ramadanMode = document.getElementById('ramadanMode').checked;
    const ramadanEndDate = document.getElementById('ramadanEndDate').value;
    
    const days = parseInt(daysInput.value);
    let targetParts = goalType === 'full' ? 30 : parseFloat(targetPartsInput.value);
    
    // Validation
    if (!days || days < 1) {
        showToast('يرجى إدخال عدد الأيام');
        return;
    }
    
    if (goalType === 'custom' && (!targetParts || targetParts <= 0)) {
        showToast('يرجى إدخال عدد الأجزاء المستهدفة');
        return;
    }
    
    if (ramadanMode && !ramadanEndDate) {
        showToast('يرجى اختيار تاريخ نهاية رمضان');
        return;
    }
    
    // Create plan
    state.plan = {
        days: days,
        targetParts: targetParts,
        startDate: new Date().toISOString(),
        ramadan: ramadanMode,
        ramadanEnd: ramadanMode ? ramadanEndDate : null
    };
    
    saveState();
    renderUI();
    showToast('تم حفظ الخطة بنجاح! 🎉');
    
    // Enable reading input
    document.getElementById('readingInput').disabled = false;
    document.getElementById('notesInput').disabled = false;
    document.getElementById('addReadingBtn').disabled = false;
    
    // Enable quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.disabled = false;
    });
    
    // Smooth scroll to stats
    document.getElementById('stats').scrollIntoView({ behavior: 'smooth' });
}

function resetPlan() {
    if (!confirm('هل أنت متأكد من إعادة تعيين الخطة وجميع السجلات؟')) {
        return;
    }
    
    state.plan = null;
    state.logs = [];
    
    localStorage.removeItem('plan');
    localStorage.removeItem('logs');
    
    // Reset form
    document.getElementById('goalType').value = 'full';
    document.getElementById('daysInput').value = '';
    document.getElementById('targetPartsInput').value = '';
    document.getElementById('ramadanMode').checked = false;
    document.getElementById('ramadanEndDate').value = '';
    document.getElementById('customTargetGroup').style.display = 'none';
    document.getElementById('ramadanEndGroup').style.display = 'none';
    document.getElementById('daysInput').disabled = false;
    
    // Disable reading input
    document.getElementById('readingInput').disabled = true;
    document.getElementById('notesInput').disabled = true;
    document.getElementById('addReadingBtn').disabled = true;
    document.getElementById('readingInput').value = '';
    document.getElementById('notesInput').value = '';
    
    // Disable quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Reset achievements and streak
    state.achievements = [];
    state.streak = 0;
    state.longestStreak = 0;
    localStorage.removeItem('achievements');
    localStorage.removeItem('streak');
    localStorage.removeItem('longestStreak');
    
    renderUI();
    renderLogs();
    renderAchievements();
    renderWeeklyChart();
    showToast('تم إعادة تعيين الخطة');
}

// ===================================
// READING LOG MANAGEMENT
// ===================================
function addReading() {
    const readingInput = document.getElementById('readingInput');
    const notesInput = document.getElementById('notesInput');
    const amount = parseFloat(readingInput.value);
    const notes = notesInput.value.trim();
    
    if (!amount || amount <= 0) {
        showToast('يرجى إدخال مقدار القراءة');
        return;
    }
    
    if (!state.plan) {
        showToast('يرجى إنشاء خطة أولاً');
        return;
    }
    
    // Create log entry
    const log = {
        dateAR: new Date().toLocaleDateString('ar-SA'),
        dateISO: new Date().toISOString(),
        amount: amount,
        notes: notes || ''
    };
    
    state.logs.push(log);
    calculateStreak();
    checkAchievements();
    saveState();
    renderUI();
    renderLogs();
    renderAchievements();
    renderWeeklyChart();
    
    // Clear input and focus
    readingInput.value = '';
    notesInput.value = '';
    readingInput.focus();
    
    showToast(`تم إضافة ${amount} جزء 📖`);
}

function quickAddReading(amount) {
    if (!state.plan) {
        showToast('يرجى إنشاء خطة أولاً');
        return;
    }
    
    const log = {
        dateAR: new Date().toLocaleDateString('ar-SA'),
        dateISO: new Date().toISOString(),
        amount: amount,
        notes: ''
    };
    
    state.logs.push(log);
    calculateStreak();
    checkAchievements();
    saveState();
    renderUI();
    renderLogs();
    renderAchievements();
    renderWeeklyChart();
    
    showToast(`تم إضافة ${amount} جزء 📖`);
}

function deleteLog(index) {
    const row = document.querySelectorAll('#logsTableBody tr:not(.no-data)')[index];
    if (row) {
        row.classList.add('row-removing');
    }
    
    setTimeout(() => {
        state.logs.splice(index, 1);
        calculateStreak();
        saveState();
        renderUI();
        renderLogs();
        renderAchievements();
        renderWeeklyChart();
        showToast('تم حذف السجل');
    }, 300);
}

function clearAllLogs() {
    if (!confirm('هل أنت متأكد من حذف جميع السجلات؟')) {
        return;
    }
    
    state.logs = [];
    state.streak = 0;
    calculateStreak();
    saveState();
    renderUI();
    renderLogs();
    renderAchievements();
    renderWeeklyChart();
    showToast('تم حذف جميع السجلات');
}

// ===================================
// STATISTICS COMPUTATION
// ===================================
function computeStats() {
    if (!state.plan) {
        return {
            totalRead: 0,
            remaining: 30,
            progress: 0,
            daysLeft: '-',
            wird: 0,
            status: 'none'
        };
    }
    
    // Calculate total read
    const totalRead = state.logs.reduce((sum, log) => sum + log.amount, 0);
    const remaining = Math.max(state.plan.targetParts - totalRead, 0);
    const progress = Math.min((totalRead / state.plan.targetParts) * 100, 100);
    
    // Calculate elapsed and remaining days
    const startDate = new Date(state.plan.startDate);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const elapsedTime = today - startDate;
    const elapsedDays = Math.floor(elapsedTime / (1000 * 60 * 60 * 24));
    const remainingDays = state.plan.days - elapsedDays;
    const safeRemainingDays = Math.max(remainingDays, 1);
    
    // Calculate daily wird
    const wird = remaining / safeRemainingDays;
    
    // Determine status
    let status = 'active';
    if (progress >= 100) {
        status = 'completed';
    } else if (remainingDays <= 0) {
        status = 'expired';
    }
    
    return {
        totalRead: totalRead.toFixed(2),
        remaining: remaining.toFixed(2),
        progress: progress.toFixed(2),
        daysLeft: remainingDays > 0 ? remainingDays : 0,
        wird: wird.toFixed(2),
        status: status
    };
}

// ===================================
// UI RENDERING
// ===================================
function renderUI() {
    const stats = computeStats();
    
    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressFill.style.width = stats.progress + '%';
    progressText.textContent = stats.progress + '%';
    
    // Update stats
    document.getElementById('totalRead').textContent = stats.totalRead;
    document.getElementById('remaining').textContent = stats.remaining;
    document.getElementById('daysLeft').textContent = stats.daysLeft;
    
    // Update status badge
    const statusBadge = document.getElementById('statusBadge');
    statusBadge.className = 'badge-status';
    
    if (!state.plan) {
        statusBadge.textContent = 'ابدأ بخطة';
        statusBadge.classList.add('status-none');
    } else if (stats.status === 'completed') {
        statusBadge.textContent = 'تم الإنجاز 🎉';
        statusBadge.classList.add('status-completed');
        showCelebration();
    } else if (stats.status === 'expired') {
        statusBadge.textContent = 'انتهت الأيام';
        statusBadge.classList.add('status-expired');
        hideCelebration();
    } else {
        statusBadge.textContent = 'مستمر';
        statusBadge.classList.add('status-active');
        hideCelebration();
    }
    
    // Update plan summary
    if (state.plan) {
        document.getElementById('planSummary').style.display = 'block';
        document.getElementById('dailyWird').textContent = stats.wird;
        document.getElementById('targetDisplay').textContent = state.plan.targetParts;
        
        const startDate = new Date(state.plan.startDate);
        document.getElementById('startDateDisplay').textContent = startDate.toLocaleDateString('ar-SA');
    } else {
        document.getElementById('planSummary').style.display = 'none';
    }
}

function renderLogs() {
    const tbody = document.getElementById('logsTableBody');
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    
    const filteredLogs = getFilteredLogs();
    
    if (filteredLogs.length === 0) {
        tbody.innerHTML = `
            <tr class="no-data">
                <td colspan="4" class="text-center text-muted">
                    <i class="fas fa-inbox fa-2x mb-2"></i>
                    <p>لا توجد قراءات مسجلة بعد</p>
                </td>
            </tr>
        `;
        clearLogsBtn.style.display = state.logs.length > 0 ? 'block' : 'none';
        return;
    }
    
    tbody.innerHTML = filteredLogs.map((log, index) => {
        const originalIndex = state.logs.indexOf(log);
        return `
        <tr>
            <td>${log.dateAR}</td>
            <td>${log.amount} جزء</td>
            <td>${log.notes || '-'}</td>
            <td>
                <button class="btn btn-danger btn-sm delete-log-btn" data-index="${originalIndex}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
    
    clearLogsBtn.style.display = 'block';
}

function getFilteredLogs() {
    let filtered = [...state.logs];
    
    // Apply search filter
    const searchTerm = document.getElementById('searchLogs').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(log => 
            log.dateAR.includes(searchTerm) || 
            log.notes.toLowerCase().includes(searchTerm) ||
            log.amount.toString().includes(searchTerm)
        );
    }
    
    // Apply date filter
    const filterType = document.getElementById('filterLogs').value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filterType === 'today') {
        filtered = filtered.filter(log => {
            const logDate = new Date(log.dateISO);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === today.getTime();
        });
    } else if (filterType === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(log => {
            const logDate = new Date(log.dateISO);
            return logDate >= weekAgo;
        });
    } else if (filterType === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(log => {
            const logDate = new Date(log.dateISO);
            return logDate >= monthAgo;
        });
    }
    
    return filtered.reverse();
}

function filterLogs() {
    renderLogs();
}

function showCelebration() {
    document.getElementById('completionCelebration').style.display = 'block';
}

function hideCelebration() {
    document.getElementById('completionCelebration').style.display = 'none';
}

// ===================================
// THEME MANAGEMENT
// ===================================
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    saveState();
    applyTheme();
}

function applyTheme() {
    const html = document.documentElement;
    const themeIcon = document.querySelector('#themeToggle i');
    
    if (state.theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        html.removeAttribute('data-theme');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

// ===================================
// UTILITIES
// ===================================
function showToast(message) {
    const toastEl = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 3000
    });
    
    toast.show();
}

function setCurrentYear() {
    document.getElementById('currentYear').textContent = new Date().getFullYear();
}

// ===================================
// START APPLICATION
// ===================================
document.addEventListener('DOMContentLoaded', init);


// ===================================
// ACHIEVEMENTS SYSTEM
// ===================================
function checkAchievements() {
    const totalRead = state.logs.reduce((sum, log) => sum + log.amount, 0);
    
    ACHIEVEMENTS.forEach(achievement => {
        if (state.achievements.includes(achievement.id)) return;
        
        let unlocked = false;
        
        if (achievement.type === 'streak') {
            unlocked = state.streak >= achievement.requirement;
        } else {
            unlocked = totalRead >= achievement.requirement;
        }
        
        if (unlocked) {
            state.achievements.push(achievement.id);
            showToast(`🎉 إنجاز جديد: ${achievement.title}!`);
        }
    });
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    const totalRead = state.logs.reduce((sum, log) => sum + log.amount, 0);
    
    grid.innerHTML = ACHIEVEMENTS.map(achievement => {
        const isUnlocked = state.achievements.includes(achievement.id);
        const lockedClass = isUnlocked ? 'unlocked' : 'locked';
        
        return `
            <div class="col-md-4 col-sm-6">
                <div class="achievement-card ${lockedClass}">
                    ${isUnlocked ? '<span class="achievement-badge">✓ مكتمل</span>' : ''}
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ===================================
// STREAK CALCULATION
// ===================================
function calculateStreak() {
    if (state.logs.length === 0) {
        state.streak = 0;
        updateStreakDisplay();
        return;
    }
    
    // Sort logs by date
    const sortedLogs = [...state.logs].sort((a, b) => 
        new Date(b.dateISO) - new Date(a.dateISO)
    );
    
    // Get unique dates
    const uniqueDates = [...new Set(sortedLogs.map(log => {
        const date = new Date(log.dateISO);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }))].sort((a, b) => b - a);
    
    if (uniqueDates.length === 0) {
        state.streak = 0;
        updateStreakDisplay();
        return;
    }
    
    // Check if today or yesterday has reading
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const latestDate = uniqueDates[0];
    if (latestDate !== today.getTime() && latestDate !== yesterday.getTime()) {
        state.streak = 0;
        updateStreakDisplay();
        return;
    }
    
    // Calculate streak
    let streak = 1;
    let currentDate = new Date(latestDate);
    
    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(currentDate);
        prevDate.setDate(prevDate.getDate() - 1);
        
        if (uniqueDates[i] === prevDate.getTime()) {
            streak++;
            currentDate = new Date(uniqueDates[i]);
        } else {
            break;
        }
    }
    
    state.streak = streak;
    
    // Update longest streak
    if (state.streak > state.longestStreak) {
        state.longestStreak = state.streak;
    }
    
    updateStreakDisplay();
}

function updateStreakDisplay() {
    document.getElementById('streakNumber').textContent = state.streak;
    document.getElementById('longestStreak').textContent = state.longestStreak;
}

// ===================================
// WEEKLY CHART
// ===================================
function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get last 7 days data
    const today = new Date();
    const weekData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dayLogs = state.logs.filter(log => {
            const logDate = new Date(log.dateISO);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === date.getTime();
        });
        
        const total = dayLogs.reduce((sum, log) => sum + log.amount, 0);
        
        weekData.push({
            label: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
            value: total
        });
    }
    
    // Draw simple bar chart
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const barWidth = chartWidth / weekData.length - 10;
    const maxValue = Math.max(...weekData.map(d => d.value), 1);
    
    // Get theme colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#f7fafc' : '#2d3748';
    const barColor = '#667eea';
    
    ctx.font = '12px Cairo';
    ctx.textAlign = 'center';
    
    weekData.forEach((data, index) => {
        const x = padding + index * (barWidth + 10);
        const barHeight = (data.value / maxValue) * chartHeight;
        const y = canvas.height - padding - barHeight;
        
        // Draw bar
        ctx.fillStyle = barColor;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw label
        ctx.fillStyle = textColor;
        ctx.fillText(data.label, x + barWidth / 2, canvas.height - padding + 20);
        
        // Draw value
        if (data.value > 0) {
            ctx.fillText(data.value.toFixed(1), x + barWidth / 2, y - 5);
        }
    });
}

// ===================================
// EXPORT DATA
// ===================================
function exportData() {
    const data = {
        plan: state.plan,
        logs: state.logs,
        achievements: state.achievements,
        streak: state.streak,
        longestStreak: state.longestStreak,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `zad-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showToast('تم تصدير البيانات بنجاح 📥');
}
