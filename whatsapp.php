<?php
session_start();
require_once 'config/database.php';
require_once 'includes/auth.php';

requirePermission('whatsapp');

$db = getDB();
$message = '';
$error = '';

// معالجة إرسال الرسائل
if ($_POST) {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'send_test') {
        $phone = trim($_POST['phone']);
        $test_message = trim($_POST['message']);
        
        if (empty($phone)) {
            $error = 'يرجى إدخال رقم الهاتف';
        } else {
            // استدعاء خدمة الواتساب المحلية
            $result = sendWhatsAppMessage($phone, $test_message);
            if ($result['success']) {
                $message = 'تم إرسال الرسالة بنجاح';
            } else {
                $error = 'فشل في إرسال الرسالة: ' . $result['error'];
            }
        }
    }
    
    if ($action === 'send_session_report') {
        $session_id = $_POST['session_id'];
        
        if (empty($session_id)) {
            $error = 'يرجى اختيار الجلسة';
        } else {
            $result = sendSessionReport($session_id);
            if ($result['success']) {
                $message = "تم إرسال {$result['sent']} رسالة من أصل {$result['total']} طالب";
            } else {
                $error = 'فشل في إرسال التقرير: ' . $result['error'];
            }
        }
    }
}

// جلب الجلسات
$sessions = $db->fetchAll("
    SELECT s.*, c.name as class_name, t.name as teacher_name 
    FROM sessions s 
    JOIN classes c ON s.class_id = c.id 
    LEFT JOIN teachers t ON c.teacher_id = t.id 
    WHERE s.status IN ('active', 'completed') 
    ORDER BY s.start_time DESC 
    LIMIT 20
");

// جلب سجل الرسائل
$whatsapp_logs = $db->fetchAll("
    SELECT w.*, s.name as student_name 
    FROM whatsapp_logs w 
    JOIN students s ON w.student_id = s.id 
    ORDER BY w.send_time DESC 
    LIMIT 50
");

// دوال الواتساب
function sendWhatsAppMessage($phone, $message) {
    // استدعاء خدمة الواتساب المحلية عبر HTTP
    $url = 'http://localhost:3002/send-message';
    $data = [
        'phone' => $phone,
        'message' => $message
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        return ['success' => false, 'error' => 'فشل في الاتصال بخدمة الواتساب'];
    }
    
    return json_decode($result, true);
}

function sendSessionReport($session_id) {
    // استدعاء خدمة الواتساب المحلية لإرسال تقرير الجلسة
    $url = 'http://localhost:3002/send-session-report';
    $data = ['session_id' => $session_id];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        return ['success' => false, 'error' => 'فشل في الاتصال بخدمة الواتساب'];
    }
    
    return json_decode($result, true);
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة الواتساب - نظام إدارة الحضور</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="container-fluid mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fab fa-whatsapp text-success"></i> إدارة الواتساب</h2>
            <div>
                <span class="badge bg-success" id="whatsapp-status">
                    <i class="fas fa-circle"></i> متصل
                </span>
            </div>
        </div>

        <?php if ($message): ?>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle me-2"></i>
                <?php echo htmlspecialchars($message); ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <?php echo htmlspecialchars($error); ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>

        <!-- التبويبات -->
        <ul class="nav nav-tabs" id="whatsappTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="test-tab" data-bs-toggle="tab" data-bs-target="#test" type="button">
                    <i class="fas fa-vial"></i> اختبار الرسائل
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="reports-tab" data-bs-toggle="tab" data-bs-target="#reports" type="button">
                    <i class="fas fa-paper-plane"></i> إرسال التقارير
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="logs-tab" data-bs-toggle="tab" data-bs-target="#logs" type="button">
                    <i class="fas fa-history"></i> سجل الرسائل
                </button>
            </li>
        </ul>

        <div class="tab-content" id="whatsappTabsContent">
            <!-- تبويب اختبار الرسائل -->
            <div class="tab-pane fade show active" id="test" role="tabpanel">
                <div class="card mt-3">
                    <div class="card-header">
                        <h5><i class="fas fa-vial"></i> اختبار إرسال رسالة</h5>
                    </div>
                    <div class="card-body">
                        <form method="POST">
                            <input type="hidden" name="action" value="send_test">
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="phone" class="form-label">رقم الهاتف *</label>
                                        <input type="tel" class="form-control" id="phone" name="phone" 
                                               placeholder="201002246668" required>
                                        <div class="form-text">أدخل الرقم مع كود الدولة</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">حالة الخدمة</label>
                                        <div class="form-control-plaintext">
                                            <span class="badge bg-success">
                                                <i class="fas fa-check-circle"></i> خدمة الواتساب تعمل
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="message" class="form-label">نص الرسالة</label>
                                <textarea class="form-control" id="message" name="message" rows="4" 
                                          placeholder="اتركه فارغاً لاستخدام رسالة اختبار افتراضية..."></textarea>
                            </div>
                            
                            <button type="submit" class="btn btn-success">
                                <i class="fas fa-paper-plane"></i> إرسال رسالة اختبار
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- تبويب إرسال التقارير -->
            <div class="tab-pane fade" id="reports" role="tabpanel">
                <div class="card mt-3">
                    <div class="card-header">
                        <h5><i class="fas fa-paper-plane"></i> إرسال تقارير الجلسات</h5>
                    </div>
                    <div class="card-body">
                        <form method="POST">
                            <input type="hidden" name="action" value="send_session_report">
                            
                            <div class="mb-3">
                                <label for="session_id" class="form-label">اختر الجلسة *</label>
                                <select class="form-select" id="session_id" name="session_id" required>
                                    <option value="">اختر الجلسة...</option>
                                    <?php foreach ($sessions as $session): ?>
                                        <option value="<?php echo $session['id']; ?>">
                                            <?php echo htmlspecialchars($session['class_name']); ?> - 
                                            <?php echo htmlspecialchars($session['teacher_name']); ?> - 
                                            <?php echo date('Y-m-d H:i', strtotime($session['start_time'])); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            
                            <div class="alert alert-info">
                                <i class="fas fa-info-circle me-2"></i>
                                <strong>ملاحظة:</strong> سيتم إرسال رسائل الحضور والتقييمات لجميع أولياء الأمور في الجلسة المختارة.
                            </div>
                            
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i> إرسال تقرير الجلسة
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <!-- تبويب سجل الرسائل -->
            <div class="tab-pane fade" id="logs" role="tabpanel">
                <div class="card mt-3">
                    <div class="card-header">
                        <h5><i class="fas fa-history"></i> سجل الرسائل</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>الطالب</th>
                                        <th>نوع الرسالة</th>
                                        <th>رقم الهاتف</th>
                                        <th>الحالة</th>
                                        <th>وقت الإرسال</th>
                                        <th>الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($whatsapp_logs as $log): ?>
                                        <tr>
                                            <td><?php echo htmlspecialchars($log['student_name']); ?></td>
                                            <td>
                                                <span class="badge bg-secondary">
                                                    <?php echo getMessageTypeText($log['message_type']); ?>
                                                </span>
                                            </td>
                                            <td><?php echo htmlspecialchars($log['phone_number']); ?></td>
                                            <td>
                                                <span class="badge <?php echo getStatusBadgeClass($log['status']); ?>">
                                                    <?php echo getStatusText($log['status']); ?>
                                                </span>
                                            </td>
                                            <td><?php echo date('Y-m-d H:i', strtotime($log['send_time'])); ?></td>
                                            <td>
                                                <button class="btn btn-sm btn-info" 
                                                        onclick="viewMessage('<?php echo htmlspecialchars($log['message']); ?>')">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                            
                            <?php if (empty($whatsapp_logs)): ?>
                                <div class="text-center py-4">
                                    <i class="fab fa-whatsapp fa-3x text-muted mb-3"></i>
                                    <p class="text-muted">لا توجد رسائل مرسلة</p>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal عرض الرسالة -->
    <div class="modal fade" id="messageModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">محتوى الرسالة</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-light">
                        <pre id="messageContent" style="white-space: pre-wrap; font-family: 'Cairo', sans-serif;"></pre>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function viewMessage(message) {
            document.getElementById('messageContent').textContent = message;
            new bootstrap.Modal(document.getElementById('messageModal')).show();
        }
        
        // فحص حالة الواتساب كل 30 ثانية
        setInterval(checkWhatsAppStatus, 30000);
        
        function checkWhatsAppStatus() {
            fetch('api/whatsapp_status.php')
                .then(response => response.json())
                .then(data => {
                    const statusElement = document.getElementById('whatsapp-status');
                    if (data.connected) {
                        statusElement.className = 'badge bg-success';
                        statusElement.innerHTML = '<i class="fas fa-circle"></i> متصل';
                    } else {
                        statusElement.className = 'badge bg-danger';
                        statusElement.innerHTML = '<i class="fas fa-circle"></i> غير متصل';
                    }
                })
                .catch(error => {
                    console.error('خطأ في فحص حالة الواتساب:', error);
                });
        }
    </script>
</body>
</html>

<?php
function getMessageTypeText($type) {
    $types = [
        'absence' => 'غياب',
        'performance' => 'أداء',
        'attendance' => 'حضور',
        'reminder' => 'تذكير',
        'announcement' => 'إعلان',
        'session_report' => 'تقرير جلسة',
        'custom' => 'مخصص'
    ];
    return $types[$type] ?? $type;
}

function getStatusText($status) {
    $statuses = [
        'pending' => 'في الانتظار',
        'sent' => 'تم الإرسال',
        'delivered' => 'تم التسليم',
        'read' => 'تم القراءة',
        'failed' => 'فشل'
    ];
    return $statuses[$status] ?? $status;
}

function getStatusBadgeClass($status) {
    $classes = [
        'pending' => 'bg-warning',
        'sent' => 'bg-primary',
        'delivered' => 'bg-success',
        'read' => 'bg-info',
        'failed' => 'bg-danger'
    ];
    return $classes[$status] ?? 'bg-secondary';
}
?>