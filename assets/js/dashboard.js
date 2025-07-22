// JavaScript للوحة التحكم

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadRecentActivity();
    loadAlerts();
});

// تحميل الإحصائيات
function loadDashboardStats() {
    fetch('api/dashboard_stats.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('totalStudents').textContent = data.data.totalStudents;
                document.getElementById('totalClasses').textContent = data.data.totalClasses;
                document.getElementById('activeSessions').textContent = data.data.activeSessions;
                document.getElementById('attendanceRate').textContent = data.data.attendanceRate + '%';
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل الإحصائيات:', error);
        });
}

// تحميل النشاط الأخير
function loadRecentActivity() {
    fetch('api/recent_activity.php')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('recentActivity');
            
            if (data.success && data.data.length > 0) {
                let html = '<div class="list-group list-group-flush">';
                
                data.data.forEach(activity => {
                    const icon = getActivityIcon(activity.action);
                    const time = new Date(activity.created_at).toLocaleString('ar-EG');
                    
                    html += `
                        <div class="list-group-item list-group-item-action">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">
                                    <i class="${icon} me-2"></i>
                                    ${activity.action_text}
                                </h6>
                                <small class="text-muted">${time}</small>
                            </div>
                            <p class="mb-1">${activity.details}</p>
                            <small class="text-muted">بواسطة: ${activity.user_name}</small>
                        </div>
                    `;
                });
                
                html += '</div>';
                container.innerHTML = html;
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-clock fa-2x mb-3"></i>
                        <p>لا يوجد نشاط حديث</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل النشاط الأخير:', error);
            document.getElementById('recentActivity').innerHTML = `
                <div class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <p>خطأ في تحميل البيانات</p>
                </div>
            `;
        });
}

// تحميل التنبيهات
function loadAlerts() {
    fetch('api/alerts.php')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('alerts');
            
            if (data.success && data.data.length > 0) {
                let html = '';
                
                data.data.forEach(alert => {
                    const alertClass = getAlertClass(alert.type);
                    const icon = getAlertIcon(alert.type);
                    
                    html += `
                        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                            <i class="${icon} me-2"></i>
                            <strong>${alert.title}</strong><br>
                            ${alert.message}
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        </div>
                    `;
                });
                
                container.innerHTML = html;
            } else {
                container.innerHTML = `
                    <div class="text-center text-muted">
                        <i class="fas fa-check-circle fa-2x mb-3"></i>
                        <p>لا توجد تنبيهات</p>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('خطأ في تحميل التنبيهات:', error);
            document.getElementById('alerts').innerHTML = `
                <div class="text-center text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
                    <p>خطأ في تحميل التنبيهات</p>
                </div>
            `;
        });
}

// دوال مساعدة
function getActivityIcon(action) {
    const icons = {
        'CREATE': 'fas fa-plus-circle text-success',
        'UPDATE': 'fas fa-edit text-warning',
        'DELETE': 'fas fa-trash text-danger',
        'LOGIN': 'fas fa-sign-in-alt text-info'
    };
    return icons[action] || 'fas fa-circle text-secondary';
}

function getAlertClass(type) {
    const classes = {
        'success': 'alert-success',
        'warning': 'alert-warning',
        'danger': 'alert-danger',
        'info': 'alert-info'
    };
    return classes[type] || 'alert-secondary';
}

function getAlertIcon(type) {
    const icons = {
        'success': 'fas fa-check-circle',
        'warning': 'fas fa-exclamation-triangle',
        'danger': 'fas fa-times-circle',
        'info': 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-bell';
}

// تحديث البيانات كل 30 ثانية
setInterval(function() {
    loadDashboardStats();
    loadRecentActivity();
    loadAlerts();
}, 30000);