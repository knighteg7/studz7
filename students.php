<?php
session_start();
require_once 'config/database.php';
require_once 'includes/auth.php';

requirePermission('students');

$db = getDB();
$message = '';
$error = '';

// معالجة الإجراءات
if ($_POST) {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'add' && hasPermission('studentsEdit')) {
        $name = trim($_POST['name']);
        $parent_phone = trim($_POST['parent_phone']);
        $parent_email = trim($_POST['parent_email']);
        $class_id = !empty($_POST['class_id']) ? $_POST['class_id'] : null;
        
        // توليد باركود تلقائي
        $barcode = generateStudentBarcode();
        
        try {
            $sql = "INSERT INTO students (name, barcode, parent_phone, parent_email, class_id) VALUES (?, ?, ?, ?, ?)";
            $db->execute($sql, [$name, $barcode, $parent_phone, $parent_email, $class_id]);
            $message = "تم إضافة الطالب بنجاح";
        } catch (Exception $e) {
            $error = "خطأ في إضافة الطالب: " . $e->getMessage();
        }
    }
    
    if ($action === 'edit' && hasPermission('studentsEdit')) {
        $id = $_POST['id'];
        $name = trim($_POST['name']);
        $parent_phone = trim($_POST['parent_phone']);
        $parent_email = trim($_POST['parent_email']);
        $class_id = !empty($_POST['class_id']) ? $_POST['class_id'] : null;
        
        try {
            $sql = "UPDATE students SET name = ?, parent_phone = ?, parent_email = ?, class_id = ? WHERE id = ?";
            $db->execute($sql, [$name, $parent_phone, $parent_email, $class_id, $id]);
            $message = "تم تحديث بيانات الطالب بنجاح";
        } catch (Exception $e) {
            $error = "خطأ في تحديث الطالب: " . $e->getMessage();
        }
    }
    
    if ($action === 'delete' && hasPermission('studentsDelete')) {
        $id = $_POST['id'];
        
        try {
            $sql = "DELETE FROM students WHERE id = ?";
            $db->execute($sql, [$id]);
            $message = "تم حذف الطالب بنجاح";
        } catch (Exception $e) {
            $error = "خطأ في حذف الطالب: " . $e->getMessage();
        }
    }
}

// جلب البيانات
$search = $_GET['search'] ?? '';
$class_filter = $_GET['class_filter'] ?? '';

$sql = "SELECT s.*, c.name as class_name 
        FROM students s 
        LEFT JOIN classes c ON s.class_id = c.id 
        WHERE s.is_active = 1";
$params = [];

if ($search) {
    $sql .= " AND (s.name LIKE ? OR s.barcode LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($class_filter) {
    if ($class_filter === 'no_class') {
        $sql .= " AND s.class_id IS NULL";
    } else {
        $sql .= " AND s.class_id = ?";
        $params[] = $class_filter;
    }
}

$sql .= " ORDER BY s.name";
$students = $db->fetchAll($sql, $params);

// جلب الفصول للفلترة
$classes = $db->fetchAll("SELECT * FROM classes WHERE is_active = 1 ORDER BY name");

function generateStudentBarcode() {
    global $db;
    $sql = "SELECT barcode FROM students WHERE barcode LIKE 'STUD%' ORDER BY barcode DESC LIMIT 1";
    $result = $db->fetchOne($sql);
    
    if ($result) {
        $lastNumber = intval(substr($result['barcode'], 4));
        $newNumber = $lastNumber + 1;
    } else {
        $newNumber = 1;
    }
    
    return 'STUD' . str_pad($newNumber, 6, '0', STR_PAD_LEFT);
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إدارة الطلاب - نظام إدارة الحضور</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="assets/css/style.css" rel="stylesheet">
</head>
<body>
    <?php include 'includes/navbar.php'; ?>

    <div class="container-fluid mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-users"></i> إدارة الطلاب</h2>
            <?php if (hasPermission('studentsEdit')): ?>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addStudentModal">
                    <i class="fas fa-plus"></i> إضافة طالب
                </button>
            <?php endif; ?>
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

        <!-- البحث والفلترة -->
        <div class="card mb-4">
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-6">
                        <label for="search" class="form-label">البحث</label>
                        <input type="text" class="form-control" id="search" name="search" 
                               placeholder="البحث بالاسم أو الكود" value="<?php echo htmlspecialchars($search); ?>">
                    </div>
                    <div class="col-md-4">
                        <label for="class_filter" class="form-label">الفصل</label>
                        <select class="form-select" id="class_filter" name="class_filter">
                            <option value="">جميع الفصول</option>
                            <option value="no_class" <?php echo $class_filter === 'no_class' ? 'selected' : ''; ?>>بدون فصل</option>
                            <?php foreach ($classes as $class): ?>
                                <option value="<?php echo $class['id']; ?>" 
                                        <?php echo $class_filter == $class['id'] ? 'selected' : ''; ?>>
                                    <?php echo htmlspecialchars($class['name']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">&nbsp;</label>
                        <button type="submit" class="btn btn-primary w-100">
                            <i class="fas fa-search"></i> بحث
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- جدول الطلاب -->
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>الاسم</th>
                                <th>الكود</th>
                                <th>الفصل</th>
                                <th>هاتف ولي الأمر</th>
                                <th>تاريخ الإضافة</th>
                                <th>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($students as $student): ?>
                                <tr>
                                    <td>
                                        <strong><?php echo htmlspecialchars($student['name']); ?></strong>
                                    </td>
                                    <td>
                                        <code><?php echo htmlspecialchars($student['barcode']); ?></code>
                                    </td>
                                    <td>
                                        <?php if ($student['class_name']): ?>
                                            <span class="badge bg-primary"><?php echo htmlspecialchars($student['class_name']); ?></span>
                                        <?php else: ?>
                                            <span class="badge bg-secondary">بدون فصل</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo htmlspecialchars($student['parent_phone']); ?></td>
                                    <td><?php echo date('Y-m-d', strtotime($student['created_at'])); ?></td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <?php if (hasPermission('studentsEdit')): ?>
                                                <button class="btn btn-sm btn-warning" 
                                                        onclick="editStudent(<?php echo htmlspecialchars(json_encode($student)); ?>)">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            <?php endif; ?>
                                            <?php if (hasPermission('studentsDelete')): ?>
                                                <button class="btn btn-sm btn-danger" 
                                                        onclick="deleteStudent(<?php echo $student['id']; ?>, '<?php echo htmlspecialchars($student['name']); ?>')">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            <?php endif; ?>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    
                    <?php if (empty($students)): ?>
                        <div class="text-center py-4">
                            <i class="fas fa-users fa-3x text-muted mb-3"></i>
                            <p class="text-muted">لا توجد طلاب مطابقين للبحث</p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal إضافة طالب -->
    <div class="modal fade" id="addStudentModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">إضافة طالب جديد</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST">
                    <div class="modal-body">
                        <input type="hidden" name="action" value="add">
                        
                        <div class="mb-3">
                            <label for="name" class="form-label">اسم الطالب *</label>
                            <input type="text" class="form-control" id="name" name="name" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="parent_phone" class="form-label">رقم هاتف ولي الأمر *</label>
                            <input type="tel" class="form-control" id="parent_phone" name="parent_phone" 
                                   placeholder="201002246668" required>
                            <div class="form-text">أدخل الرقم مع كود الدولة (12 رقم)</div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="parent_email" class="form-label">بريد ولي الأمر</label>
                            <input type="email" class="form-control" id="parent_email" name="parent_email">
                        </div>
                        
                        <div class="mb-3">
                            <label for="class_id" class="form-label">الفصل</label>
                            <select class="form-select" id="class_id" name="class_id">
                                <option value="">بدون فصل</option>
                                <?php foreach ($classes as $class): ?>
                                    <option value="<?php echo $class['id']; ?>">
                                        <?php echo htmlspecialchars($class['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            سيتم توليد كود الطالب تلقائياً: <strong><?php echo generateStudentBarcode(); ?></strong>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="submit" class="btn btn-primary">إضافة الطالب</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal تعديل طالب -->
    <div class="modal fade" id="editStudentModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">تعديل بيانات الطالب</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form method="POST" id="editStudentForm">
                    <div class="modal-body">
                        <input type="hidden" name="action" value="edit">
                        <input type="hidden" name="id" id="edit_id">
                        
                        <div class="mb-3">
                            <label for="edit_name" class="form-label">اسم الطالب *</label>
                            <input type="text" class="form-control" id="edit_name" name="name" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="edit_parent_phone" class="form-label">رقم هاتف ولي الأمر *</label>
                            <input type="tel" class="form-control" id="edit_parent_phone" name="parent_phone" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="edit_parent_email" class="form-label">بريد ولي الأمر</label>
                            <input type="email" class="form-control" id="edit_parent_email" name="parent_email">
                        </div>
                        
                        <div class="mb-3">
                            <label for="edit_class_id" class="form-label">الفصل</label>
                            <select class="form-select" id="edit_class_id" name="class_id">
                                <option value="">بدون فصل</option>
                                <?php foreach ($classes as $class): ?>
                                    <option value="<?php echo $class['id']; ?>">
                                        <?php echo htmlspecialchars($class['name']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="submit" class="btn btn-warning">حفظ التغييرات</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function editStudent(student) {
            document.getElementById('edit_id').value = student.id;
            document.getElementById('edit_name').value = student.name;
            document.getElementById('edit_parent_phone').value = student.parent_phone;
            document.getElementById('edit_parent_email').value = student.parent_email || '';
            document.getElementById('edit_class_id').value = student.class_id || '';
            
            new bootstrap.Modal(document.getElementById('editStudentModal')).show();
        }
        
        function deleteStudent(id, name) {
            if (confirm('هل أنت متأكد من حذف الطالب: ' + name + '؟')) {
                const form = document.createElement('form');
                form.method = 'POST';
                form.innerHTML = `
                    <input type="hidden" name="action" value="delete">
                    <input type="hidden" name="id" value="${id}">
                `;
                document.body.appendChild(form);
                form.submit();
            }
        }
    </script>
</body>
</html>