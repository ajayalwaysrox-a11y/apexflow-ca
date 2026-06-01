// -------------------------------------------------------------
// STATE ENGINE & STORAGE WITH CLOUD SYNC & AUTHENTICATION
// -------------------------------------------------------------

const STORAGE_KEY = 'apexflow_app_state';
const SYNC_CONFIG_KEY = 'apexflow_sync_config';

// Predefined demo passwords for mock users
const defaultPasswords = {
    'S001': 'admin123',
    'S002': 'manager123',
    'S003': 'staff123',
    'S004': 'staff123',
    'S005': 'staff123'
};

// Initial default state if none exists
const defaultState = {
    staff: [
        { id: 'S001', name: 'Alex Dev', email: 'alex@apexflow.com', role: 'Admin', quota: 22, color: '#0ea5e9', password: 'admin123' },
        { id: 'S002', name: 'Sarah Jenkins', email: 'sarah@apexflow.com', role: 'Manager', quota: 20, color: '#10b981', password: 'manager123' },
        { id: 'S003', name: 'Liam Baker', email: 'liam@apexflow.com', role: 'User', quota: 15, color: '#f59e0b', password: 'staff123' },
        { id: 'S004', name: 'Sophia Patel', email: 'sophia@apexflow.com', role: 'User', quota: 18, color: '#8b5cf6', password: 'staff123' },
        { id: 'S005', name: 'Ryan Cole', email: 'ryan@apexflow.com', role: 'User', quota: 15, color: '#64748b', password: 'staff123' }
    ],
    tasks: [
        { 
            id: 'T001', 
            title: 'Optimize Database Queries', 
            desc: 'Refactor indexes on active records to speed up performance.', 
            assignedTo: 'S003', 
            priority: 'High', 
            status: 'Pending', 
            createdAt: '2026-05-28T09:00:00Z', 
            dueDate: '2026-06-05',
            history: [
                { action: 'Created', user: 'Alex Dev', date: '2026-05-28T09:00:00Z', reason: '' }
            ]
        },
        { 
            id: 'T002', 
            title: 'Design Sky Blue UI Kit', 
            desc: 'Create component library and design system in Figma.', 
            assignedTo: 'S004', 
            priority: 'Medium', 
            status: 'Completed', 
            createdAt: '2026-05-27T10:30:00Z', 
            dueDate: '2026-05-29', 
            completedAt: '2026-05-29T16:45:00Z',
            history: [
                { action: 'Created', user: 'Alex Dev', date: '2026-05-27T10:30:00Z', reason: '' },
                { action: 'Completed', user: 'Sophia Patel', date: '2026-05-29T16:45:00Z', reason: '' }
            ]
        },
        { 
            id: 'T003', 
            title: 'Prepare Q2 Security Audit', 
            desc: 'Coordinate with cybersecurity team to update compliance rules.', 
            assignedTo: 'S002', 
            priority: 'High', 
            status: 'Pending', 
            createdAt: '2026-05-29T08:00:00Z', 
            dueDate: '2026-06-10',
            history: [
                { action: 'Created', user: 'Alex Dev', date: '2026-05-29T08:00:00Z', reason: '' }
            ]
        },
        { 
            id: 'T004', 
            title: 'Review Client Proposals', 
            desc: 'Approve or comment on incoming service contracts.', 
            assignedTo: 'S001', 
            priority: 'Low', 
            status: 'Completed', 
            createdAt: '2026-05-25T14:00:00Z', 
            dueDate: '2026-05-28', 
            completedAt: '2026-05-27T11:20:00Z',
            history: [
                { action: 'Created', user: 'Alex Dev', date: '2026-05-25T14:00:00Z', reason: '' },
                { action: 'Completed', user: 'Alex Dev', date: '2026-05-27T11:20:00Z', reason: '' }
            ]
        },
        { 
            id: 'T005', 
            title: 'Integrate Payment Gateways', 
            desc: 'Implement Stripe and PayPal hooks for subscription checkout.', 
            assignedTo: 'S003', 
            priority: 'High', 
            status: 'Pending', 
            createdAt: '2026-05-30T09:15:00Z', 
            dueDate: '2026-06-03',
            history: [
                { action: 'Created', user: 'Alex Dev', date: '2026-05-30T09:15:00Z', reason: '' }
            ]
        }
    ],
    attendance: [
        { id: 'A001', staffId: 'S003', date: '2026-05-28', status: 'Present', clockIn: '08:58:30 AM', clockOut: '05:02:10 PM', remarks: 'Standard shift' },
        { id: 'A002', staffId: 'S004', date: '2026-05-28', status: 'Half Day', clockIn: '09:05:00 AM', clockOut: '01:00:00 PM', remarks: 'Doctor checkup' },
        { id: 'A003', staffId: 'S005', date: '2026-05-28', status: 'Leave', clockIn: null, clockOut: null, remarks: 'Sick leave' },
        { id: 'A004', staffId: 'S003', date: '2026-05-29', status: 'Present', clockIn: '08:45:15 AM', clockOut: '05:30:00 PM', remarks: 'Worked extra time' },
        { id: 'A005', staffId: 'S004', date: '2026-05-29', status: 'Present', clockIn: '08:55:00 AM', clockOut: '05:05:00 PM', remarks: 'Standard shift' },
        { id: 'A006', staffId: 'S005', date: '2026-05-29', status: 'Present', clockIn: '09:12:40 AM', clockOut: '05:00:10 PM', remarks: 'Late check-in' }
    ]
};

// Local storage copy
let appState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;

// Ensure everyone has a password if loaded from older localStorage
appState.staff.forEach(s => {
    if (!s.password) {
        s.password = defaultPasswords[s.id] || 'staff123';
    }
});

// Sync configuration state
const defaultSyncConfig = {
    companyKey: 'default-company-123',
    mode: 'sandbox', // sandbox or custom
    customConfig: {
        databaseURL: '',
        apiKey: '',
        authDomain: '',
        projectId: ''
    }
};

let syncConfig = JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)) || defaultSyncConfig;

// Authentication active status
let loggedInUserId = localStorage.getItem('apexflow_session_user_id') || null;

// Firebase References
let dbRef = null;
let firebaseApp = null;
let isIncomingSync = false; // prevents recursive loop when firebase updates local state

// -------------------------------------------------------------
// APP INITIALIZATION
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let analyticsChart = null;
let expandedTaskIds = new Set(); // tracks which tasks show detailed history logs

function initApp() {
    // 1. Setup Navigation tabs
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            
            menuItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(targetId).classList.add('active');

            const titles = {
                'dashboard-section': { main: 'Dashboard Overview', sub: 'Welcome back, track your business efficiency.' },
                'tasks-section': { main: 'Task Board', sub: 'Manage and track tasks and completion timelines.' },
                'attendance-section': { main: 'Attendance Console', sub: 'Clock-in/out and staff leaves dashboard.' },
                'staff-section': { main: 'Staff Directory', sub: 'Manage business employees and roles.' }
            };
            
            document.getElementById('page-title').textContent = titles[targetId].main;
            document.getElementById('page-subtitle').textContent = titles[targetId].sub;

            if (targetId === 'dashboard-section') {
                renderCharts();
            }
        });
    });

    // 2. Setup Real-time Clocks
    setInterval(updateLiveClocks, 1000);
    updateLiveClocks();

    // 3. Register Event Listeners (Modals, Buttons, Forms)
    setupEventListeners();

    // 4. Initialize Firebase Cloud Sync
    initFirebase();

    // 5. Run Initial Check and Render
    checkSessionState();
}

function updateLiveClocks() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    
    const dashboardClock = document.getElementById('live-clock');
    if (dashboardClock) dashboardClock.textContent = timeString;

    const consoleClockTime = document.getElementById('console-time');
    if (consoleClockTime) consoleClockTime.textContent = timeString;

    const consoleClockDate = document.getElementById('console-date');
    if (consoleClockDate) consoleClockDate.textContent = dateString;
}

// -------------------------------------------------------------
// FIREBASE SYNCHRONIZATION LOGIC
// -------------------------------------------------------------

function initFirebase() {
    const indicator = document.getElementById('sync-status');
    
    try {
        // Prepare Firebase parameters
        let firebaseConfig = {};
        
        if (syncConfig.mode === 'sandbox') {
            // Public Sandbox DB URL for instant out-of-the-box system syncing
            firebaseConfig = {
                databaseURL: "https://apexflow-tracker-sandbox-default-rtdb.firebaseio.com"
            };
        } else {
            // User-configured private Firebase project details
            firebaseConfig = {
                apiKey: syncConfig.customConfig.apiKey,
                authDomain: `${syncConfig.customConfig.projectId}.firebaseapp.com`,
                databaseURL: syncConfig.customConfig.databaseURL,
                projectId: syncConfig.customConfig.projectId
            };
        }

        // Initialize Firebase SDK if libraries loaded and not already initialized
        if (typeof firebase !== 'undefined' && firebaseConfig.databaseURL) {
            // Delete previous app instance if it exists
            if (firebase.apps.length > 0) {
                firebase.app().delete();
            }
            
            firebaseApp = firebase.initializeApp(firebaseConfig);
            const db = firebase.database();
            
            // Scope everything under the Workspace/Company Key
            const scopePath = `/workspaces/${syncConfig.companyKey}`;
            dbRef = db.ref(scopePath);

            setSyncStatusIndicator('connecting', 'Connecting...');

            // Bind incoming real-time cloud data listener
            dbRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    isIncomingSync = true;
                    // Safely merge incoming state
                    appState.tasks = data.tasks || [];
                    appState.attendance = data.attendance || [];
                    appState.staff = data.staff || [];
                    
                    // Maintain password fields locally if missing on cloud
                    appState.staff.forEach(s => {
                        if (!s.password) s.password = defaultPasswords[s.id] || 'staff123';
                    });

                    saveLocalStorageOnly();
                    
                    // Re-render dashboard
                    renderAll();
                    isIncomingSync = false;
                    
                    setSyncStatusIndicator('connected', `Synced (${syncConfig.companyKey})`);
                } else {
                    // Database empty on cloud path, upload local initial database
                    pushStateToCloud();
                    setSyncStatusIndicator('connected', `Synced (${syncConfig.companyKey})`);
                }
            }, (error) => {
                console.error("Firebase Sync Read Error:", error);
                setSyncStatusIndicator('offline', 'Sync Error');
            });
            
        } else {
            setSyncStatusIndicator('offline', 'Local Mode (No Sync SDK)');
        }
    } catch (e) {
        console.error("Firebase Initialization Failed:", e);
        setSyncStatusIndicator('offline', 'Sync Offline');
    }
}

function pushStateToCloud() {
    if (isIncomingSync) return; // avoid infinite feedback loops
    
    saveLocalStorageOnly();

    if (dbRef) {
        setSyncStatusIndicator('connecting', 'Syncing...');
        dbRef.set({
            staff: appState.staff,
            tasks: appState.tasks,
            attendance: appState.attendance
        }).then(() => {
            setSyncStatusIndicator('connected', `Synced (${syncConfig.companyKey})`);
        }).catch((err) => {
            console.error("Cloud Sync write failed:", err);
            setSyncStatusIndicator('offline', 'Sync Failed');
        });
    }
}

function saveLocalStorageOnly() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function setSyncStatusIndicator(state, message) {
    const indicator = document.getElementById('sync-status');
    if (!indicator) return;
    
    indicator.className = 'sync-indicator badge';
    indicator.innerHTML = '';
    
    if (state === 'connected') {
        indicator.classList.add('badge-success');
        indicator.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> ${message}`;
    } else if (state === 'connecting') {
        indicator.classList.add('badge-warning');
        indicator.innerHTML = `<i class="fa-solid fa-rotate clock-pulse"></i> ${message}`;
    } else {
        indicator.classList.add('badge-danger');
        indicator.innerHTML = `<i class="fa-solid fa-cloud-slash"></i> ${message}`;
    }
}

// -------------------------------------------------------------
// USER SESSIONS & AUTHENTICATION
// -------------------------------------------------------------

function checkSessionState() {
    const errorBlock = document.getElementById('login-error');
    if (errorBlock) errorBlock.style.display = 'none';

    if (loggedInUserId) {
        // Authenticated Session
        document.body.classList.remove('logged-out');
        document.body.classList.add('logged-in');
        renderAll();
    } else {
        // Guest/Not Authenticated
        document.body.classList.remove('logged-in');
        document.body.classList.add('logged-out');
    }
}

function handleLogin(email, password) {
    const errorBlock = document.getElementById('login-error');
    errorBlock.style.display = 'none';

    // Verify username & password against active staff registry
    const member = appState.staff.find(s => s.email.toLowerCase() === email.toLowerCase().trim());

    if (member && member.password === password) {
        loggedInUserId = member.id;
        localStorage.setItem('apexflow_session_user_id', member.id);
        checkSessionState();
    } else {
        errorBlock.textContent = "Incorrect email address or password.";
        errorBlock.style.display = 'block';
    }
}

function handleLogout() {
    loggedInUserId = null;
    localStorage.removeItem('apexflow_session_user_id');
    checkSessionState();
}

function getActiveUser() {
    return appState.staff.find(m => m.id === loggedInUserId) || null;
}

// -------------------------------------------------------------
// UI PERMISSIONS CONTROLLER
// -------------------------------------------------------------

function applyRolePermissions() {
    const user = getActiveUser();
    if (!user) return;
    
    // Clear old privilege classes
    document.body.classList.remove('role-admin', 'role-manager', 'role-user');
    
    if (user.role === 'Admin') {
        document.body.classList.add('role-admin');
        document.getElementById('nav-staff-item').style.display = 'flex';
    } else if (user.role === 'Manager') {
        document.body.classList.add('role-manager');
        document.getElementById('nav-staff-item').style.display = 'flex';
    } else {
        document.body.classList.add('role-user');
        document.getElementById('nav-staff-item').style.display = 'none';
        
        // Redirect standard users away from staff roster page if active
        const activeSection = document.querySelector('.content-section.active');
        if (activeSection && activeSection.id === 'staff-section') {
            document.querySelector('[data-target="dashboard-section"]').click();
        }
    }

    // Update Profile badge
    document.getElementById('sidebar-user-name').textContent = user.name;
    document.getElementById('sidebar-user-role').textContent = user.role;
    
    const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('sidebar-user-avatar').textContent = initials;
}

// -------------------------------------------------------------
// EVENTS ROUTING
// -------------------------------------------------------------

function setupEventListeners() {
    // 1. Session Login & Logout Forms
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        handleLogin(email, pass);
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        handleLogout();
    });

    // 2. Modals: Sync Configuration Modals
    const syncModal = document.getElementById('sync-settings-modal');
    document.getElementById('open-sync-modal-btn').addEventListener('click', () => {
        // Load configuration to UI inputs
        document.getElementById('sync-key').value = syncConfig.companyKey;
        document.getElementById('sync-mode').value = syncConfig.mode;
        
        document.getElementById('fb-database-url').value = syncConfig.customConfig.databaseURL || '';
        document.getElementById('fb-api-key').value = syncConfig.customConfig.apiKey || '';
        document.getElementById('fb-project-id').value = syncConfig.customConfig.projectId || '';

        toggleFirebaseFields(syncConfig.mode);
        openModal(syncModal);
    });
    
    document.getElementById('close-sync-modal-btn').addEventListener('click', () => closeModal(syncModal));
    document.getElementById('cancel-sync-modal-btn').addEventListener('click', () => closeModal(syncModal));

    document.getElementById('sync-mode').addEventListener('change', (e) => {
        toggleFirebaseFields(e.target.value);
    });

    document.getElementById('sync-settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSyncSettings();
        closeModal(syncModal);
    });

    function toggleFirebaseFields(mode) {
        const fields = document.getElementById('custom-fb-fields');
        fields.style.display = mode === 'custom' ? 'block' : 'none';
    }

    // 3. Modals: Reopen Task Prompt
    const reopenModal = document.getElementById('reopen-task-modal');
    document.getElementById('close-reopen-modal-btn').addEventListener('click', () => closeModal(reopenModal));
    document.getElementById('cancel-reopen-modal-btn').addEventListener('click', () => closeModal(reopenModal));
    
    document.getElementById('reopen-task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitReopenTask();
        closeModal(reopenModal);
    });

    // 4. Modals: Task Creator
    const addTaskModal = document.getElementById('add-task-modal');
    document.getElementById('open-add-task-modal-btn').addEventListener('click', () => {
        populateTaskAssigneeSelect();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('task-due').value = tomorrow.toISOString().split('T')[0];
        openModal(addTaskModal);
    });
    document.getElementById('close-task-modal-btn').addEventListener('click', () => closeModal(addTaskModal));
    document.getElementById('cancel-task-modal-btn').addEventListener('click', () => closeModal(addTaskModal));
    
    document.getElementById('add-task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        createTask();
        closeModal(addTaskModal);
    });

    // 5. Modals: Staff Creator
    const addStaffModal = document.getElementById('add-staff-modal');
    const openAddStaffBtn = document.getElementById('open-add-staff-modal-btn');
    if (openAddStaffBtn) {
        openAddStaffBtn.addEventListener('click', () => openModal(addStaffModal));
    }
    document.getElementById('close-staff-modal-btn').addEventListener('click', () => closeModal(addStaffModal));
    document.getElementById('cancel-staff-modal-btn').addEventListener('click', () => closeModal(addStaffModal));
    
    document.getElementById('add-staff-form').addEventListener('submit', (e) => {
        e.preventDefault();
        createStaff();
        closeModal(addStaffModal);
    });

    // 6. Attendance Clock Triggers
    document.getElementById('dash-clock-in-btn').addEventListener('click', () => handleClockIn());
    document.getElementById('dash-clock-out-btn').addEventListener('click', () => handleClockOut());
    document.getElementById('console-clock-in-btn').addEventListener('click', () => handleClockIn());
    document.getElementById('console-clock-out-btn').addEventListener('click', () => handleClockOut());

    // 7. Time off requests
    document.getElementById('leave-request-form').addEventListener('submit', (e) => {
        e.preventDefault();
        submitLeaveRequest();
    });

    // 8. Filters
    document.getElementById('attendance-filter-date').addEventListener('input', (e) => {
        renderAttendanceLogs(e.target.value);
    });
    document.getElementById('clear-attendance-filter-btn').addEventListener('click', () => {
        document.getElementById('attendance-filter-date').value = '';
        renderAttendanceLogs();
    });

    const taskFilters = document.querySelectorAll('.btn-filter');
    taskFilters.forEach(btn => {
        btn.addEventListener('click', (e) => {
            taskFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks(btn.getAttribute('data-filter'));
        });
    });
}

function openModal(modal) {
    modal.classList.add('show');
}

function closeModal(modal) {
    modal.classList.remove('show');
    const form = modal.querySelector('form');
    if (form) form.reset();
}

function saveSyncSettings() {
    const companyKey = document.getElementById('sync-key').value.trim();
    const mode = document.getElementById('sync-mode').value;
    
    syncConfig.companyKey = companyKey || 'default-company-123';
    syncConfig.mode = mode;
    
    if (mode === 'custom') {
        syncConfig.customConfig.databaseURL = document.getElementById('fb-database-url').value.trim();
        syncConfig.customConfig.apiKey = document.getElementById('fb-api-key').value.trim();
        syncConfig.customConfig.projectId = document.getElementById('fb-project-id').value.trim();
    }
    
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(syncConfig));
    
    // Reboot firebase client with new details
    initFirebase();
}

// -------------------------------------------------------------
// CORE RENDER AND CRUD CONTROLLERS
// -------------------------------------------------------------

function renderAll() {
    applyRolePermissions();
    renderStats();
    renderDashboardWorkloadTable();
    renderTasks('all');
    renderAttendanceConsole();
    renderAttendanceLogs();
    renderLeaveQuotas();
    renderStaffDirectory();
    renderCharts();
}

// 1. DASHBOARD METRICS SUMMARY
function renderStats() {
    const user = getActiveUser();
    if (!user) return;
    
    const today = getTodayDateString();

    // Filters task calculation scope (Users only see personal)
    let userTasks = appState.tasks;
    if (user.role === 'User') {
        userTasks = appState.tasks.filter(t => t.assignedTo === user.id);
    }

    const total = userTasks.length;
    const pending = userTasks.filter(t => t.status === 'Pending').length;
    const completed = userTasks.filter(t => t.status === 'Completed').length;

    // Daily Attendance rate percentage
    const todayLogs = appState.attendance.filter(a => a.date === today);
    const presentCount = todayLogs.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
    const attendancePercentage = appState.staff.length > 0 
        ? Math.round((presentCount / appState.staff.length) * 100) 
        : 0;

    document.getElementById('stat-total-tasks').textContent = total;
    document.getElementById('stat-pending-tasks').textContent = pending;
    document.getElementById('stat-completed-tasks').textContent = completed;
    document.getElementById('stat-attendance-rate').textContent = `${attendancePercentage}%`;

    // Local user leaves display
    const leaveCalculations = getStaffLeaveStats(user.id);
    document.getElementById('dash-leaves-taken').textContent = leaveCalculations.taken.toFixed(1);
    document.getElementById('dash-leaves-remaining').textContent = leaveCalculations.remaining.toFixed(1);
}

function getStaffLeaveStats(staffId) {
    const staffMember = appState.staff.find(s => s.id === staffId);
    if (!staffMember) return { quota: 0, taken: 0, remaining: 0 };

    const logs = appState.attendance.filter(a => a.staffId === staffId);
    let taken = 0;
    
    logs.forEach(log => {
        if (log.status === 'Leave') {
            taken += 1.0;
        } else if (log.status === 'Half Day') {
            taken += 0.5;
        }
    });

    const remaining = Math.max(0, staffMember.quota - taken);
    return { quota: staffMember.quota, taken, remaining };
}

// 2. DASHBOARD STAFF WORKLOAD GRID
function renderDashboardWorkloadTable() {
    const tbody = document.querySelector('#workload-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    appState.staff.forEach(member => {
        const staffTasks = appState.tasks.filter(t => t.assignedTo === member.id);
        const pendingCount = staffTasks.filter(t => t.status === 'Pending').length;
        const completedCount = staffTasks.filter(t => t.status === 'Completed').length;
        
        const workloadPercentage = staffTasks.length > 0 
            ? Math.min(100, Math.round((pendingCount / 5) * 100)) 
            : 0;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="flex-row gap-2">
                    <div class="user-avatar" style="background-color: ${member.color}20; color: ${member.color}; width: 32px; height: 32px; font-size: 0.8rem;">
                        ${member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <strong>${member.name}</strong>
                </div>
            </td>
            <td><span class="badge badge-sky">${member.role}</span></td>
            <td><span class="badge ${pendingCount > 0 ? 'badge-warning' : 'badge-success'}">${pendingCount} Pending</span></td>
            <td><span class="badge badge-success">${completedCount} Done</span></td>
            <td>
                <div class="flex-col gap-2">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${workloadPercentage}%; background: ${pendingCount > 3 ? 'var(--danger)' : 'var(--primary)'}"></div>
                    </div>
                    <span class="text-xs text-muted" style="font-size: 0.75rem">${pendingCount} active workload</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. TASK BOARD CRUD OPERATIONS WITH HISTORY
function populateTaskAssigneeSelect() {
    const select = document.getElementById('task-assignee');
    select.innerHTML = '';
    
    appState.staff.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        select.appendChild(option);
    });
}

function createTask() {
    const user = getActiveUser();
    if (user.role !== 'Admin') {
        alert('Access Denied: Only Admins can assign tasks.');
        return;
    }

    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const assignedTo = document.getElementById('task-assignee').value;
    const dueDate = document.getElementById('task-due').value;
    const priority = document.getElementById('task-priority').value;

    const newTask = {
        id: 'T' + String(appState.tasks.length + 1).padStart(3, '0'),
        title,
        desc,
        assignedTo,
        priority,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        dueDate,
        completedAt: null,
        history: [
            { action: 'Created', user: user.name, date: new Date().toISOString(), reason: '' }
        ]
    };

    appState.tasks.unshift(newTask);
    pushStateToCloud();
    renderAll();
}

function renderTasks(filter = 'all') {
    const tbody = document.getElementById('tasks-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const user = getActiveUser();
    if (!user) return;

    let filteredTasks = [...appState.tasks];
    
    // User role can only see their own assigned works
    if (user.role === 'User') {
        filteredTasks = filteredTasks.filter(t => t.assignedTo === user.id);
    }

    if (filter === 'pending') {
        filteredTasks = filteredTasks.filter(t => t.status === 'Pending');
    } else if (filter === 'completed') {
        filteredTasks = filteredTasks.filter(t => t.status === 'Completed');
    }

    if (filteredTasks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted" style="padding: 2rem;">No tasks found matching criteria.</td></tr>`;
        return;
    }

    filteredTasks.forEach(task => {
        const staff = appState.staff.find(s => s.id === task.assignedTo) || { name: 'Unknown', color: '#64748b' };
        const creationDate = new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const completionDate = task.completedAt 
            ? new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '-';

        let badgeClass = 'badge-warning';
        if (task.priority === 'High') badgeClass = 'badge-danger';
        if (task.priority === 'Low') badgeClass = 'badge-sky';

        const isExpanded = expandedTaskIds.has(task.id);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="flex-col">
                    <div class="flex-row gap-2" style="cursor: pointer;" onclick="toggleTaskHistory('${task.id}')">
                        <i class="fa-solid ${isExpanded ? 'fa-angle-down' : 'fa-angle-right'} text-primary" style="font-size: 0.8rem;"></i>
                        <strong>${task.title}</strong>
                    </div>
                    <span class="text-xs text-muted" style="font-size: 0.8rem; padding-left: 1.1rem;">${task.desc || 'No description'}</span>
                </div>
            </td>
            <td>
                <div class="flex-row gap-2">
                    <div class="user-avatar" style="background-color: ${staff.color}20; color: ${staff.color}; width: 28px; height: 28px; font-size: 0.75rem;">
                        ${staff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <span>${staff.name}</span>
                </div>
            </td>
            <td><span class="text-muted" style="font-size: 0.85rem">${creationDate}</span></td>
            <td>
                <span class="badge ${task.status === 'Completed' ? 'badge-success' : 'badge-warning'}">
                    ${task.status === 'Completed' ? '<i class="fa-solid fa-circle-check"></i> Completed' : '<i class="fa-solid fa-clock"></i> Pending'}
                </span>
            </td>
            <td>
                <span class="badge ${badgeClass}">${task.priority} // Due ${task.dueDate}</span>
            </td>
            <td><span class="text-muted" style="font-size: 0.85rem">${completionDate}</span></td>
            <td class="text-right">
                <div class="flex-row gap-2" style="justify-content: flex-end;">
                    ${task.status === 'Pending' ? `
                        <button class="btn btn-primary btn-sm" onclick="markTaskComplete('${task.id}')" title="Complete Work">
                            <i class="fa-solid fa-check"></i> Complete
                        </button>
                    ` : `
                        <button class="btn btn-outline btn-sm" onclick="triggerReopenModal('${task.id}')" title="Reopen Task">
                            <i class="fa-solid fa-clock-rotate-left"></i> Reopen
                        </button>
                    `}
                    <!-- Only Admin can delete tasks -->
                    ${user.role === 'Admin' ? `
                        <button class="btn-icon text-danger" onclick="deleteTask('${task.id}')" title="Delete Task">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        // Render collapsible history details row
        if (isExpanded) {
            const detailTr = document.createElement('tr');
            detailTr.className = 'detail-row';
            
            let historyHtml = '';
            if (task.history && task.history.length > 0) {
                historyHtml = task.history.map(item => {
                    const localTime = new Date(item.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    
                    return `
                        <div class="history-timeline-item">
                            <span class="time">${localTime}</span>
                            <span class="action">${item.action}</span> by <strong class="text-primary">${item.user}</strong>
                            ${item.reason ? `<span class="reason">Reason: "${item.reason}"</span>` : ''}
                        </div>
                    `;
                }).join('');
            } else {
                historyHtml = `<div class="text-muted text-xs">No audit logs found.</div>`;
            }

            detailTr.innerHTML = `
                <td colspan="7" style="padding: 0; border: none;">
                    <div class="task-history-details">
                        <h4><i class="fa-solid fa-clock-rotate-left"></i> Task Audit History Trail</h4>
                        <div class="history-timeline">
                            ${historyHtml}
                        </div>
                    </div>
                </td>
            `;
            tbody.appendChild(detailTr);
        }
    });
}

window.toggleTaskHistory = function(taskId) {
    if (expandedTaskIds.has(taskId)) {
        expandedTaskIds.delete(taskId);
    } else {
        expandedTaskIds.add(taskId);
    }
    renderTasks(document.querySelector('.btn-filter.active').getAttribute('data-filter') || 'all');
};

window.markTaskComplete = function(taskId) {
    const user = getActiveUser();
    const task = appState.tasks.find(t => t.id === taskId);
    
    if (task) {
        task.status = 'Completed';
        task.completedAt = new Date().toISOString();
        
        if (!task.history) task.history = [];
        task.history.push({
            action: 'Completed',
            user: user.name,
            date: new Date().toISOString(),
            reason: ''
        });

        pushStateToCloud();
        renderAll();
    }
};

window.triggerReopenModal = function(taskId) {
    document.getElementById('reopen-task-id').value = taskId;
    document.getElementById('reopen-reason').value = '';
    openModal(document.getElementById('reopen-task-modal'));
};

function submitReopenTask() {
    const user = getActiveUser();
    const taskId = document.getElementById('reopen-task-id').value;
    const reason = document.getElementById('reopen-reason').value.trim();
    
    if (!reason) return;

    const task = appState.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'Pending';
        task.completedAt = null;
        
        if (!task.history) task.history = [];
        task.history.push({
            action: 'Reopened',
            user: user.name,
            date: new Date().toISOString(),
            reason: reason
        });

        // Ensure row collapses/expands correctly to show history change
        expandedTaskIds.add(task.id);

        pushStateToCloud();
        renderAll();
    }
}

window.deleteTask = function(taskId) {
    const user = getActiveUser();
    if (user.role !== 'Admin') {
        alert('Access Denied: Only Admins can delete tasks.');
        return;
    }

    if (confirm('Are you sure you want to delete this task? This action is irreversible.')) {
        appState.tasks = appState.tasks.filter(t => t.id !== taskId);
        pushStateToCloud();
        renderAll();
    }
};

// 4. ATTENDANCE & LEAVES
function getTodayDateString() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - (offset * 60 * 1000));
    return localNow.toISOString().split('T')[0];
}

function renderAttendanceConsole() {
    const user = getActiveUser();
    if (!user) return;

    const today = getTodayDateString();
    
    const log = appState.attendance.find(a => a.staffId === user.id && a.date === today);

    const checkInBtnDash = document.getElementById('dash-clock-in-btn');
    const checkOutBtnDash = document.getElementById('dash-clock-out-btn');
    const statusTagDash = document.getElementById('dash-clock-status');

    const checkInBtnConsole = document.getElementById('console-clock-in-btn');
    const checkOutBtnConsole = document.getElementById('console-clock-out-btn');
    
    const summaryIn = document.getElementById('att-summary-in');
    const summaryOut = document.getElementById('att-summary-out');
    const summaryShift = document.getElementById('att-summary-shift');

    if (!log) {
        // Not clocked in today
        setClockStatus(false, true);
        statusTagDash.innerHTML = `Status: <span class="badge badge-danger">Not Clocked In</span>`;
        summaryIn.textContent = '-';
        summaryOut.textContent = '-';
        summaryShift.textContent = '-';
    } else {
        if (log.status === 'Leave') {
            setClockStatus(true, true);
            statusTagDash.innerHTML = `Status: <span class="badge badge-purple">On Leave (Full Day)</span>`;
            summaryIn.textContent = 'LEAVE';
            summaryOut.textContent = 'LEAVE';
            summaryShift.textContent = 'Leave Day';
        } else {
            const isHalfDay = log.status === 'Half Day';
            summaryIn.textContent = log.clockIn || '-';
            summaryOut.textContent = log.clockOut || '-';
            summaryShift.textContent = isHalfDay ? 'Half Day Shift' : 'Full Day Shift';

            if (log.clockIn && !log.clockOut) {
                // Active session
                setClockStatus(true, false);
                statusTagDash.innerHTML = `Status: <span class="badge badge-warning">Clocked In (Active)</span>`;
            } else if (log.clockIn && log.clockOut) {
                // Completed session
                setClockStatus(true, true);
                statusTagDash.innerHTML = `Status: <span class="badge badge-success">Clocked Out (Shift Done)</span>`;
            }
        }
    }

    function setClockStatus(inBtnDisabled, outBtnDisabled) {
        checkInBtnDash.disabled = inBtnDisabled;
        checkOutBtnDash.disabled = outBtnDisabled;
        checkInBtnConsole.disabled = inBtnDisabled;
        checkOutBtnConsole.disabled = outBtnDisabled;
    }
}

function handleClockIn() {
    const user = getActiveUser();
    const today = getTodayDateString();
    
    const isHalfDaySelected = document.getElementById('att-type-half').checked;
    const status = isHalfDaySelected ? 'Half Day' : 'Present';

    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const clockInTime = now.toLocaleTimeString('en-US', timeOptions);

    let log = appState.attendance.find(a => a.staffId === user.id && a.date === today);

    if (!log) {
        log = {
            id: 'A' + String(appState.attendance.length + 1).padStart(3, '0'),
            staffId: user.id,
            date: today,
            status: status,
            clockIn: clockInTime,
            clockOut: null,
            remarks: isHalfDaySelected ? 'Checked In for Half Day Shift' : 'Standard check-in'
        };
        appState.attendance.push(log);
    } else {
        log.status = status;
        log.clockIn = clockInTime;
        log.clockOut = null;
        log.remarks = isHalfDaySelected ? 'Schedule adjusted to Half Day' : 'Checked In';
    }

    pushStateToCloud();
    renderAll();
}

function handleClockOut() {
    const user = getActiveUser();
    const today = getTodayDateString();
    
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const clockOutTime = now.toLocaleTimeString('en-US', timeOptions);

    const log = appState.attendance.find(a => a.staffId === user.id && a.date === today);

    if (log && log.clockIn) {
        log.clockOut = clockOutTime;
        log.remarks = log.status === 'Half Day' ? 'Half Day Shift Completed' : 'Full Day Shift Completed';
        pushStateToCloud();
        renderAll();
    }
}

function submitLeaveRequest() {
    const user = getActiveUser();
    const dateValue = document.getElementById('leave-date').value;
    const scope = document.getElementById('leave-scope').value;
    const reason = document.getElementById('leave-reason').value.trim();

    if (!dateValue || !reason) return;

    let log = appState.attendance.find(a => a.staffId === user.id && a.date === dateValue);
    
    const leaveStatus = scope === 'Half' ? 'Half Day' : 'Leave';
    const remarkMsg = `Leave Request: ${reason}`;

    if (log) {
        log.status = leaveStatus;
        log.clockIn = null;
        log.clockOut = null;
        log.remarks = remarkMsg;
    } else {
        log = {
            id: 'A' + String(appState.attendance.length + 1).padStart(3, '0'),
            staffId: user.id,
            date: dateValue,
            status: leaveStatus,
            clockIn: null,
            clockOut: null,
            remarks: remarkMsg
        };
        appState.attendance.push(log);
    }

    pushStateToCloud();
    renderAll();
    
    alert(`Leave request for ${dateValue} (${scope === 'Half' ? 'Half Day' : 'Full Day'}) logged.`);
    document.getElementById('leave-request-form').reset();
}

function renderAttendanceLogs(dateFilter = '') {
    const tbody = document.querySelector('#attendance-log-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    let logs = [...appState.attendance];
    logs.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (dateFilter) {
        logs = logs.filter(l => l.date === dateFilter);
    }

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">No attendance records matching dates.</td></tr>`;
        return;
    }

    logs.forEach(log => {
        const staff = appState.staff.find(s => s.id === log.staffId) || { name: 'Unknown' };
        let statusBadge = 'badge-success';
        if (log.status === 'Half Day') statusBadge = 'badge-warning';
        if (log.status === 'Leave') statusBadge = 'badge-purple';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${log.date}</strong></td>
            <td><strong>${staff.name}</strong></td>
            <td><span class="badge ${statusBadge}">${log.status}</span></td>
            <td><span class="text-muted" style="font-variant-numeric: tabular-nums;">${log.clockIn || '-'}</span></td>
            <td><span class="text-muted" style="font-variant-numeric: tabular-nums;">${log.clockOut || '-'}</span></td>
            <td><span class="text-xs text-muted" style="font-size: 0.8rem;">${log.remarks || 'No logs'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderLeaveQuotas() {
    const tbody = document.querySelector('#leave-quota-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const user = getActiveUser();

    appState.staff.forEach(member => {
        const leaveStats = getStaffLeaveStats(member.id);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${member.name}</strong></td>
            <td>
                <div class="flex-row gap-2">
                    <span>${member.quota} Days</span>
                    ${user.role === 'Admin' ? `
                        <button class="btn-icon btn-sm" onclick="editLeaveQuota('${member.id}', ${member.quota})" title="Adjust Annual Quota">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
            <td><span class="text-danger font-semibold">${leaveStats.taken.toFixed(1)} Days</span></td>
            <td><span class="text-success font-semibold">${leaveStats.remaining.toFixed(1)} Days remaining</span></td>
            <td>
                ${user.role === 'Admin' ? `
                    <button class="btn btn-outline btn-sm" onclick="quickGrantLeave('${member.id}')">
                        <i class="fa-solid fa-umbrella-beach"></i> Grant Day Leave
                    </button>
                ` : `<span class="text-xs text-muted">Admin modification only</span>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editLeaveQuota = function(staffId, currentQuota) {
    const user = getActiveUser();
    if (user.role !== 'Admin') {
        alert('Access Denied: Only Admins can modify leave quotas.');
        return;
    }

    const newQuotaStr = prompt(`Set new annual leave quota for this employee:`, currentQuota);
    const newQuota = parseInt(newQuotaStr, 10);
    if (!isNaN(newQuota) && newQuota >= 0) {
        const member = appState.staff.find(s => s.id === staffId);
        if (member) {
            member.quota = newQuota;
            pushStateToCloud();
            renderAll();
        }
    }
};

window.quickGrantLeave = function(staffId) {
    const user = getActiveUser();
    if (user.role !== 'Admin') {
        alert('Access Denied: Only Admins can register leaves.');
        return;
    }

    const dateValue = prompt(`Enter date for leave (YYYY-MM-DD):`, getTodayDateString());
    if (!dateValue) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        alert('Invalid date format. Use YYYY-MM-DD');
        return;
    }

    let log = appState.attendance.find(a => a.staffId === staffId && a.date === dateValue);
    if (log) {
        log.status = 'Leave';
        log.clockIn = null;
        log.clockOut = null;
        log.remarks = 'Leave registered administratively';
    } else {
        log = {
            id: 'A' + String(appState.attendance.length + 1).padStart(3, '0'),
            staffId: staffId,
            date: dateValue,
            status: 'Leave',
            clockIn: null,
            clockOut: null,
            remarks: 'Leave registered administratively'
        };
        appState.attendance.push(log);
    }
    
    pushStateToCloud();
    renderAll();
    alert('Leave recorded successfully.');
};

// 5. STAFF DIRECTORY MANAGEMENT
function createStaff() {
    const user = getActiveUser();
    if (user.role !== 'Admin') {
        alert('Access Denied: Only Admins can register staff.');
        return;
    }

    const name = document.getElementById('staff-name').value;
    const email = document.getElementById('staff-email').value;
    const role = document.getElementById('staff-role').value;
    const quota = parseInt(document.getElementById('staff-quota').value, 10) || 20;

    const colors = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newStaff = {
        id: 'S' + String(appState.staff.length + 1).padStart(3, '0'),
        name,
        email,
        role,
        quota,
        color: randomColor,
        password: 'staff123' // default password for new staff
    };

    appState.staff.push(newStaff);
    pushStateToCloud();
    renderAll();
}

function renderStaffDirectory() {
    const container = document.getElementById('staff-cards-container');
    if (!container) return;
    container.innerHTML = '';

    const activeUser = getActiveUser();

    appState.staff.forEach(member => {
        const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        const staffTasks = appState.tasks.filter(t => t.assignedTo === member.id);
        const pendingCount = staffTasks.filter(t => t.status === 'Pending').length;
        const completedCount = staffTasks.filter(t => t.status === 'Completed').length;
        const leaves = getStaffLeaveStats(member.id);

        const card = document.createElement('div');
        card.className = 'staff-card';
        card.innerHTML = `
            <span class="badge badge-sky badge-role-tag">${member.role}</span>
            <div class="staff-card-avatar" style="background-color: ${member.color}20; color: ${member.color};">
                ${initials}
            </div>
            <h3 class="staff-card-name">${member.name}</h3>
            <span class="staff-card-email">${member.email}</span>
            
            <div class="staff-card-metrics">
                <div class="metric-item">
                    <span class="val text-warning">${pendingCount}</span>
                    <span class="lbl">Pending</span>
                </div>
                <div class="metric-item">
                    <span class="val text-success">${completedCount}</span>
                    <span class="lbl">Completed</span>
                </div>
                <div class="metric-item">
                    <span class="val text-purple">${leaves.taken.toFixed(1)}</span>
                    <span class="lbl">Leaves</span>
                </div>
            </div>

            <div class="staff-card-actions">
                ${(activeUser.role === 'Admin' && member.id !== activeUser.id) ? `
                    <button class="btn btn-outline-danger btn-sm w-full" onclick="removeStaffMember('${member.id}')">
                        <i class="fa-solid fa-user-minus"></i> Remove
                    </button>
                ` : `
                    <span class="text-xs text-muted" style="font-size: 0.75rem">${member.role} Profile</span>
                `}
            </div>
        `;
        container.appendChild(card);
    });
}

window.removeStaffMember = function(staffId) {
    const user = getActiveUser();
    if (user.role !== 'Admin') {
        alert('Access Denied: Only Admins can remove employees.');
        return;
    }

    if (confirm('Are you sure you want to remove this staff member? Their history logs will remain.')) {
        appState.staff = appState.staff.filter(s => s.id !== staffId);
        appState.attendance = appState.attendance.filter(a => a.staffId !== staffId);
        pushStateToCloud();
        renderAll();
    }
};

// -------------------------------------------------------------
// ANALYTICS GRAPHS (CHART.JS)
// -------------------------------------------------------------

function renderCharts() {
    const canvas = document.getElementById('work-distribution-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (analyticsChart) {
        analyticsChart.destroy();
    }

    const labels = appState.staff.map(s => s.name);
    const pendingData = appState.staff.map(s => {
        return appState.tasks.filter(t => t.assignedTo === s.id && t.status === 'Pending').length;
    });
    const completedData = appState.staff.map(s => {
        return appState.tasks.filter(t => t.assignedTo === s.id && t.status === 'Completed').length;
    });

    analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pending Works',
                    data: pendingData,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderColor: 'rgb(245, 158, 11)',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Completed Works',
                    data: completedData,
                    backgroundColor: 'rgba(14, 165, 233, 0.8)',
                    borderColor: 'rgb(14, 165, 233)',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
                        color: '#0f172a'
                    }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
                    bodyFont: { family: 'Plus Jakarta Sans' }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Plus Jakarta Sans', size: 10, weight: '500' },
                        color: '#64748b'
                    }
                },
                y: {
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        stepSize: 1,
                        font: { family: 'Plus Jakarta Sans', size: 10 },
                        color: '#64748b'
                    }
                }
            }
        }
    });
}
