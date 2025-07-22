<?php
session_start();
require_once 'config/database.php';
require_once 'includes/auth.php';

// إذا كان المستخدم مسجل دخول، توجيه للصفحة الرئيسية
if (isLoggedIn()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_POST) {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = 'يرجى إدخال اسم المستخدم وكلمة المرور';
    } else {
        $user = authenticateUser($username, $password);
        if ($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['permissions'] = json_decode($user['permissions'], true);
            
            header('Location: index.php');
            exit;
        } else {
            $error = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تسجيل الدخول - نظام إدارة الحضور</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="assets/css/login.css" rel="stylesheet">
</head>
<body class="bg-gradient-primary">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-xl-6 col-lg-8 col-md-9">
                <div class="card o-hidden border-0 shadow-lg my-5">
                    <div class="card-body p-0">
                        <div class="row">
                            <div class="col-lg-12">
                                <div class="p-5">
                                    <div class="text-center">
                                        <div class="mb-4">
                                            <i class="fas fa-graduation-cap fa-4x text-primary"></i>
                                        </div>
                                        <h1 class="h4 text-gray-900 mb-4">نظام إدارة الحضور الشامل</h1>
                                        <p class="text-muted">مرحباً بك، يرجى تسجيل الدخول</p>
                                    </div>
                                    
                                    <?php if ($error): ?>
                                        <div class="alert alert-danger" role="alert">
                                            <i class="fas fa-exclamation-triangle me-2"></i>
                                            <?php echo htmlspecialchars($error); ?>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <form method="POST" class="user">
                                        <div class="form-group mb-3">
                                            <label for="username" class="form-label">اسم المستخدم</label>
                                            <input type="text" class="form-control form-control-user" 
                                                   id="username" name="username" 
                                                   placeholder="أدخل اسم المستخدم"
                                                   value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>"
                                                   required>
                                        </div>
                                        <div class="form-group mb-3">
                                            <label for="password" class="form-label">كلمة المرور</label>
                                            <div class="input-group">
                                                <input type="password" class="form-control form-control-user" 
                                                       id="password" name="password" 
                                                       placeholder="أدخل كلمة المرور"
                                                       required>
                                                <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <button type="submit" class="btn btn-primary btn-user btn-block w-100">
                                            <i class="fas fa-sign-in-alt me-2"></i>
                                            تسجيل الدخول
                                        </button>
                                    </form>
                                    
                                    <div class="mt-4 p-3 bg-light rounded">
                                        <h6 class="text-muted mb-2">بيانات تجريبية:</h6>
                                        <small class="text-muted">
                                            <strong>المدير:</strong> admin / admin123<br>
                                            <strong>المشرف:</strong> supervisor1 / admin123
                                        </small>
                                    </div>
                                    
                                    <!-- معلومات المطور -->
                                    <div class="mt-4 p-3 bg-primary bg-gradient rounded text-white text-center">
                                        <h6 class="mb-2">نظام إدارة الحضور الشامل</h6>
                                        <small>
                                            تطوير: <strong>Ahmed Hosny</strong><br>
                                            📞 01272774494 - 01002246668<br>
                                            📧 Sales@GO4Host.net
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Toggle password visibility
        document.getElementById('togglePassword').addEventListener('click', function() {
            const password = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (password.type === 'password') {
                password.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                password.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    </script>
</body>
</html>