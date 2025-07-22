<?php
require_once 'config/database.php';

function authenticateUser($username, $password) {
    $db = getDB();
    
    $sql = "SELECT * FROM users WHERE username = ? AND is_active = 1";
    $user = $db->fetchOne($sql, [$username]);
    
    if ($user && password_verify($password, $user['password'])) {
        // تحديث آخر تسجيل دخول
        $updateSql = "UPDATE users SET last_login = NOW() WHERE id = ?";
        $db->execute($updateSql, [$user['id']]);
        
        return $user;
    }
    
    return false;
}

function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'name' => $_SESSION['name'],
        'role' => $_SESSION['role'],
        'permissions' => $_SESSION['permissions'] ?? []
    ];
}

function hasPermission($permission) {
    $user = getCurrentUser();
    if (!$user) return false;
    
    // المدير له جميع الصلاحيات
    if ($user['role'] === 'admin') return true;
    
    // التحقق من الصلاحية المحددة
    return isset($user['permissions'][$permission]) && $user['permissions'][$permission];
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }
}

function requirePermission($permission) {
    requireLogin();
    if (!hasPermission($permission)) {
        header('Location: index.php?error=no_permission');
        exit;
    }
}

function logout() {
    session_destroy();
    header('Location: login.php');
    exit;
}
?>