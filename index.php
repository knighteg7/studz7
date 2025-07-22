<?php
session_start();
require_once 'config/database.php';
require_once 'includes/auth.php';

// التحقق من تسجيل الدخول
if (!isLoggedIn()) {
    header('Location: login.php');
    exit;
}

$user = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نظام إدارة الحضور الشامل</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-graduation-cap me-2"></i>
                نظام إدارة الحضور
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="index.php">
                            <i class="fas fa-home"></i> الرئيسية
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="students.php">
                            <i class="fas fa-users"></i> الطلاب
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="classes.php">
                            <i class="fas fa-chalkboard"></i> الفصول
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="sessions.php">
                            <i class="fas fa-calendar"></i> الجلسات
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="attendance.php">
                            <i class="fas fa-check-circle"></i> الحضور
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="reports.php">
                            <i class="fas fa-chart-bar"></i> التقارير
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="whatsapp.php">
                            <i class="fab fa-whatsapp"></i> الواتساب
                        </a>
                    </li>
                </ul>
                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="fas fa-user"></i> <?php echo htmlspecialchars($user['name']); ?>
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="profile.php">الملف الشخصي</a></li>
                            <li><a class="dropdown-item" href="settings.php">الإعدادات</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="logout.php">تسجيل الخروج</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="container-fluid mt-4">
        <div class="row">
            <!-- Dashboard Cards -->
            <div class="col-md-3 mb-4">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 id="totalStudents">0</h4>
                                <p>إجمالي الطلاب</p>
                            </div>
                            <div class="align-self-center">
                                <i class="fas fa-users fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 id="totalClasses">0</h4>
                                <p>إجمالي الفصول</p>
                            </div>
                            <div class="align-self-center">
                                <i class="fas fa-chalkboard fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 id="activeSessions">0</h4>
                                <p>الجلسات النشطة</p>
                            </div>
                            <div class="align-self-center">
                                <i class="fas fa-calendar fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mb-4">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 id="attendanceRate">0%</h4>
                                <p>نسبة الحضور اليوم</p>
                            </div>
                            <div class="align-self-center">
                                <i class="fas fa-chart-line fa-2x"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-bolt"></i> إجراءات سريعة</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-2 mb-3">
                                <a href="attendance.php" class="btn btn-primary w-100">
                                    <i class="fas fa-qrcode d-block mb-2"></i>
                                    ماسح الحضور
                                </a>
                            </div>
                            <div class="col-md-2 mb-3">
                                <a href="students.php?action=add" class="btn btn-success w-100">
                                    <i class="fas fa-user-plus d-block mb-2"></i>
                                    إضافة طالب
                                </a>
                            </div>
                            <div class="col-md-2 mb-3">
                                <a href="sessions.php?action=add" class="btn btn-warning w-100">
                                    <i class="fas fa-plus-circle d-block mb-2"></i>
                                    إنشاء جلسة
                                </a>
                            </div>
                            <div class="col-md-2 mb-3">
                                <a href="reports.php" class="btn btn-info w-100">
                                    <i class="fas fa-chart-bar d-block mb-2"></i>
                                    التقارير
                                </a>
                            </div>
                            <div class="col-md-2 mb-3">
                                <a href="whatsapp.php" class="btn btn-success w-100">
                                    <i class="fab fa-whatsapp d-block mb-2"></i>
                                    الواتساب
                                </a>
                            </div>
                            <div class="col-md-2 mb-3">
                                <a href="settings.php" class="btn btn-secondary w-100">
                                    <i class="fas fa-cog d-block mb-2"></i>
                                    الإعدادات
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="row mt-4">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-clock"></i> النشاط الأخير</h5>
                    </div>
                    <div class="card-body">
                        <div id="recentActivity">
                            <div class="text-center">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">جاري التحميل...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-exclamation-triangle"></i> التنبيهات</h5>
                    </div>
                    <div class="card-body">
                        <div id="alerts">
                            <div class="text-center">
                                <div class="spinner-border" role="status">
                                    <span class="visually-hidden">جاري التحميل...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-light text-center py-3 mt-5">
        <div class="container">
            <p class="mb-0">
                <strong>نظام إدارة الحضور الشامل</strong> - 
                تطوير: <strong>Ahmed Hosny</strong> | 
                📞 01272774494 - 01002246668 | 
                📧 Sales@GO4Host.net
            </p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/dashboard.js"></script>
</body>
</html>