<?php
header('Content-Type: application/json');
session_start();
require_once '../config/database.php';
require_once '../includes/auth.php';

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'غير مصرح']);
    exit;
}

try {
    $db = getDB();
    
    // إجمالي الطلاب
    $totalStudents = $db->fetchOne("SELECT COUNT(*) as count FROM students WHERE is_active = 1")['count'];
    
    // إجمالي الفصول
    $totalClasses = $db->fetchOne("SELECT COUNT(*) as count FROM classes WHERE is_active = 1")['count'];
    
    // الجلسات النشطة
    $activeSessions = $db->fetchOne("SELECT COUNT(*) as count FROM sessions WHERE status = 'active'")['count'];
    
    // نسبة الحضور اليوم
    $todayAttendance = $db->fetchAll("
        SELECT status, COUNT(*) as count 
        FROM attendance 
        WHERE DATE(record_time) = CURDATE() 
        GROUP BY status
    ");
    
    $totalToday = 0;
    $presentToday = 0;
    
    foreach ($todayAttendance as $record) {
        $totalToday += $record['count'];
        if ($record['status'] === 'present') {
            $presentToday += $record['count'];
        }
    }
    
    $attendanceRate = $totalToday > 0 ? round(($presentToday / $totalToday) * 100, 1) : 0;
    
    echo json_encode([
        'success' => true,
        'data' => [
            'totalStudents' => $totalStudents,
            'totalClasses' => $totalClasses,
            'activeSessions' => $activeSessions,
            'attendanceRate' => $attendanceRate,
            'presentToday' => $presentToday,
            'totalToday' => $totalToday
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Dashboard stats error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'خطأ في الخادم']);
}
?>