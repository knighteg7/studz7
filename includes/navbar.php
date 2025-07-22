<?php
$current_page = basename($_SERVER['PHP_SELF']);
$user = getCurrentUser();
?>
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
                    <a class="nav-link <?php echo $current_page === 'index.php' ? 'active' : ''; ?>" href="index.php">
                        <i class="fas fa-home"></i> الرئيسية
                    </a>
                </li>
                
                <?php if (hasPermission('students')): ?>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'students.php' ? 'active' : ''; ?>" href="students.php">
                        <i class="fas fa-users"></i> الطلاب
                    </a>
                </li>
                <?php endif; ?>
                
                <?php if (hasPermission('classes')): ?>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'classes.php' ? 'active' : ''; ?>" href="classes.php">
                        <i class="fas fa-chalkboard"></i> الفصول
                    </a>
                </li>
                <?php endif; ?>
                
                <?php if (hasPermission('sessions')): ?>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'sessions.php' ? 'active' : ''; ?>" href="sessions.php">
                        <i class="fas fa-calendar"></i> الجلسات
                    </a>
                </li>
                <?php endif; ?>
                
                <?php if (hasPermission('attendance')): ?>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'attendance.php' ? 'active' : ''; ?>" href="attendance.php">
                        <i class="fas fa-check-circle"></i> الحضور
                    </a>
                </li>
                <?php endif; ?>
                
                <?php if (hasPermission('reports')): ?>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'reports.php' ? 'active' : ''; ?>" href="reports.php">
                        <i class="fas fa-chart-bar"></i> التقارير
                    </a>
                </li>
                <?php endif; ?>
                
                <?php if (hasPermission('whatsapp')): ?>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'whatsapp.php' ? 'active' : ''; ?>" href="whatsapp.php">
                        <i class="fab fa-whatsapp"></i> الواتساب
                    </a>
                </li>
                <?php endif; ?>
                
                <?php if (hasPermission('settings')): ?>
                <li class="nav-item">
                    <a class="nav-link <?php echo $current_page === 'settings.php' ? 'active' : ''; ?>" href="settings.php">
                        <i class="fas fa-cog"></i> الإعدادات
                    </a>
                </li>
                <?php endif; ?>
            </ul>
            <ul class="navbar-nav">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user"></i> <?php echo htmlspecialchars($user['name']); ?>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="profile.php">
                            <i class="fas fa-user-circle"></i> الملف الشخصي
                        </a></li>
                        <?php if (hasPermission('users')): ?>
                        <li><a class="dropdown-item" href="users.php">
                            <i class="fas fa-users-cog"></i> إدارة المستخدمين
                        </a></li>
                        <?php endif; ?>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="logout.php">
                            <i class="fas fa-sign-out-alt"></i> تسجيل الخروج
                        </a></li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>