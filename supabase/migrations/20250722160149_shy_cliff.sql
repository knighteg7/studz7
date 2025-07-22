-- سكريبت إعداد قاعدة البيانات على Hostinger
-- يجب تشغيله في phpMyAdmin أو MySQL CLI

-- التأكد من استخدام قاعدة البيانات الصحيحة
USE u723596365_HossamStudent;

-- حذف الجداول الموجودة (إذا كانت موجودة) لإعادة الإنشاء
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS whatsapp_logs;
DROP TABLE IF EXISTS whatsapp_templates;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS system_settings;
DROP TABLE IF EXISTS activity_logs;
SET FOREIGN_KEY_CHECKS = 1;

-- جدول المستخدمين
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'supervisor', 'teacher') NOT NULL DEFAULT 'supervisor',
    permissions JSON DEFAULT NULL,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- جدول المواد الدراسية
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);

-- جدول أماكن الحصص
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20),
    capacity INT DEFAULT 30,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
);

-- جدول المعلمين
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject_id INT,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_subject (subject_id),
    INDEX idx_active (is_active)
);

-- جدول الفصول
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    teacher_id INT,
    subject_id INT,
    max_capacity INT DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_teacher (teacher_id),
    INDEX idx_active (is_active)
);

-- جدول الطلاب
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    barcode VARCHAR(20) UNIQUE NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(100),
    class_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_barcode (barcode),
    INDEX idx_name (name),
    INDEX idx_class (class_id),
    INDEX idx_active (is_active)
);

-- جدول الجلسات
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    location_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_class (class_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status)
);

-- جدول الحضور
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    record_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    recorded_by INT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_attendance (student_id, session_id),
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_record_time (record_time)
);

-- جدول التقارير
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    teacher_rating INT CHECK (teacher_rating >= 1 AND teacher_rating <= 5),
    quiz_score DECIMAL(5,2) DEFAULT NULL,
    participation INT CHECK (participation >= 1 AND participation <= 5),
    behavior ENUM('ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'يحتاج تحسين') DEFAULT 'ممتاز',
    homework ENUM('completed', 'incomplete', 'partial') DEFAULT 'completed',
    comments TEXT,
    strengths TEXT,
    areas_for_improvement TEXT,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_report (student_id, session_id),
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_created_at (created_at)
);

-- جدول سجل رسائل الواتساب
CREATE TABLE whatsapp_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT,
    message_type ENUM('absence', 'performance', 'reminder', 'announcement', 'session_report', 'custom', 'attendance') NOT NULL,
    message TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'delivered', 'read') DEFAULT 'pending',
    send_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    sent_by INT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_send_time (send_time)
);

-- إدراج البيانات الأساسية
INSERT INTO users (username, password, name, role, permissions) VALUES
('admin', '$2b$10$Wvtj00Udo6xtksF/ilJG/.vBknd1P7i6CXICAPq9FxyEbXV2FyBK6', 'المدير العام', 'admin', 
 '{"students": true, "studentsEdit": true, "studentsDelete": true, "classes": true, "classesEdit": true, "classesDelete": true, "teachers": true, "teachersEdit": true, "teachersDelete": true, "sessions": true, "sessionsEdit": true, "sessionsDelete": true, "attendance": true, "attendanceEdit": true, "attendanceDelete": true, "reports": true, "reportsEdit": true, "reportsDelete": true, "whatsapp": true, "settings": true, "settingsEdit": true, "users": true, "usersEdit": true, "usersDelete": true}'),

('supervisor1', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z8W4uDDNOPEXY0tCXxMrahZyHgSSO', 'المشرف الأول', 'supervisor', 
 '{"students": true, "studentsEdit": true, "studentsDelete": false, "classes": true, "classesEdit": true, "classesDelete": false, "teachers": true, "teachersEdit": true, "teachersDelete": false, "sessions": true, "sessionsEdit": true, "sessionsDelete": false, "attendance": true, "attendanceEdit": true, "attendanceDelete": false, "reports": true, "reportsEdit": true, "reportsDelete": false, "whatsapp": true, "settings": false, "settingsEdit": false, "users": false, "usersEdit": false, "usersDelete": false}');

-- إدراج المواد الدراسية
INSERT INTO subjects (name, description) VALUES
('الرياضيات', 'مادة الرياضيات للمراحل المختلفة'),
('العلوم', 'مادة العلوم الطبيعية'),
('اللغة العربية', 'مادة اللغة العربية والنحو'),
('اللغة الإنجليزية', 'مادة اللغة الإنجليزية'),
('الفيزياء', 'مادة الفيزياء للمرحلة الثانوية');

-- إدراج أماكن الحصص
INSERT INTO locations (name, room_number, capacity, description) VALUES
('سنتر التفوق', 'A101', 30, 'قاعة مجهزة بأحدث التقنيات'),
('سنتر المجد', 'B201', 25, 'قاعة للمجموعات الصغيرة'),
('سنتر النجاح', 'C301', 35, 'قاعة كبيرة للمحاضرات');

-- إدراج المعلمين
INSERT INTO teachers (name, subject_id, phone, email) VALUES
('أحمد محمد علي', 1, '966501234567', 'ahmed.math@school.edu'),
('فاطمة عبدالله', 2, '966501234568', 'fatima.science@school.edu'),
('محمد حسن', 3, '966501234569', 'mohammed.arabic@school.edu');

-- إدراج الفصول
INSERT INTO classes (name, teacher_id, subject_id, max_capacity) VALUES
('الصف الأول أ - رياضيات', 1, 1, 30),
('الصف الثاني ب - علوم', 2, 2, 25),
('الصف الثالث ج - عربي', 3, 3, 28);

-- إدراج الطلاب
INSERT INTO students (name, barcode, parent_phone, parent_email, class_id) VALUES
('أحمد محمد علي', 'STUD000001', '201002246668', 'parent1@email.com', 1),
('فاطمة عبدالله', 'STUD000002', '201012345678', 'parent2@email.com', 1),
('محمد خالد', 'STUD000003', '201023456789', 'parent3@email.com', 2),
('نور حسن', 'STUD000004', '201034567890', 'parent4@email.com', 2),
('عبدالرحمن سعد', 'STUD000005', '201045678901', 'parent5@email.com', 3);

SELECT 'تم إعداد قاعدة البيانات بنجاح على Hostinger!' as message;