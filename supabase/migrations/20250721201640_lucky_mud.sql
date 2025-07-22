-- قاعدة بيانات نظام إدارة الحضور الشامل - النسخة المُصححة
-- تاريخ الإنشاء: 2025-01-21
-- متوافقة 100% مع MySQL/MariaDB
-- تم إصلاح جميع مشاكل الفهارس والكلمات المحجوزة

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS attendance_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE attendance_system;

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

-- جدول المستخدمين مع نظام الصلاحيات المتقدم
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'supervisor', 'teacher') NOT NULL DEFAULT 'supervisor',
    permissions JSON DEFAULT NULL,
    last_login DATETIME NULL,
    login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (is_active),
    INDEX idx_last_login (last_login)
);

-- جدول المواد الدراسية
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
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
    equipment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_name (name),
    INDEX idx_room_number (room_number),
    INDEX idx_active (is_active)
);

-- جدول المعلمين
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subject_id INT,
    phone VARCHAR(20),
    email VARCHAR(100),
    specialization VARCHAR(100),
    experience_years INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_subject (subject_id),
    INDEX idx_phone (phone),
    INDEX idx_active (is_active)
);

-- جدول الفصول
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    teacher_id INT,
    subject_id INT,
    max_capacity INT DEFAULT 30,
    academic_year VARCHAR(20) DEFAULT '2024-2025',
    grade_level VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_teacher (teacher_id),
    INDEX idx_subject (subject_id),
    INDEX idx_active (is_active),
    INDEX idx_academic_year (academic_year)
);

-- جدول الطلاب مع تحسينات إضافية
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    barcode VARCHAR(20) UNIQUE NOT NULL,
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(100),
    class_id INT NULL,
    date_of_birth DATE,
    address TEXT,
    emergency_contact VARCHAR(20),
    notes TEXT,
    enrollment_date DATE DEFAULT (CURRENT_DATE),
    student_id_number VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
    INDEX idx_barcode (barcode),
    INDEX idx_name (name),
    INDEX idx_class (class_id),
    INDEX idx_parent_phone (parent_phone),
    INDEX idx_active (is_active),
    INDEX idx_enrollment_date (enrollment_date)
);

-- جدول الجلسات مع تحسينات
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    location_id INT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    session_type ENUM('regular', 'exam', 'review', 'makeup') DEFAULT 'regular',
    max_attendance INT,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_class (class_id),
    INDEX idx_location (location_id),
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_status (status),
    INDEX idx_session_type (session_type),
    INDEX idx_created_at (created_at)
);

-- جدول الحضور مع إصلاح مشكلة timestamp
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    record_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    is_automatic BOOLEAN DEFAULT FALSE,
    recorded_by INT,
    check_in_time TIME,
    check_out_time TIME,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_attendance (student_id, session_id),
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_record_time (record_time)
);

-- جدول التقارير مع تحسينات
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
    parent_feedback TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_report (student_id, session_id),
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_teacher_rating (teacher_rating),
    INDEX idx_created_at (created_at),
    INDEX idx_follow_up (follow_up_required)
);

-- جدول قوالب رسائل الواتساب
CREATE TABLE whatsapp_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('absence', 'performance', 'reminder', 'announcement', 'attendance', 'custom') NOT NULL,
    template TEXT NOT NULL,
    variables JSON DEFAULT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_type (type),
    INDEX idx_active (is_active),
    INDEX idx_default (is_default)
);

-- جدول سجل رسائل الواتساب مع إصلاح مشكلة sent_at
CREATE TABLE whatsapp_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT,
    template_id INT,
    message_type ENUM('absence', 'performance', 'reminder', 'announcement', 'session_report', 'custom', 'attendance') NOT NULL,
    message TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status ENUM('pending', 'sent', 'failed', 'delivered', 'read') DEFAULT 'pending',
    send_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivered_at DATETIME NULL,
    read_at DATETIME NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    sent_by INT,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES whatsapp_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_student (student_id),
    INDEX idx_session (session_id),
    INDEX idx_template (template_id),
    INDEX idx_message_type (message_type),
    INDEX idx_status (status),
    INDEX idx_send_time (send_time),
    INDEX idx_phone_number (phone_number),
    INDEX idx_retry_count (retry_count)
);

-- جدول إعدادات النظام مع تحسينات
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    validation_rules JSON DEFAULT NULL,
    updated_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (setting_key),
    INDEX idx_category (category),
    INDEX idx_public (is_public)
);

-- جدول سجل النشاطات
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON DEFAULT NULL,
    new_values JSON DEFAULT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_entity_type (entity_type),
    INDEX idx_entity_id (entity_id),
    INDEX idx_created_at (created_at)
);

-- إدراج البيانات الأساسية المحدثة

-- إدراج المستخدمين مع نظام الصلاحيات المتقدم
INSERT INTO users (username, password, name, role, permissions) VALUES
('admin', '$2b$10$Wvtj00Udo6xtksF/ilJG/.vBknd1P7i6CXICAPq9FxyEbXV2FyBK6', 'المدير العام', 'admin', 
 '{"students": true, "studentsEdit": true, "studentsDelete": true, "classes": true, "classesEdit": true, "classesDelete": true, "teachers": true, "teachersEdit": true, "teachersDelete": true, "sessions": true, "sessionsEdit": true, "sessionsDelete": true, "attendance": true, "attendanceEdit": true, "attendanceDelete": true, "reports": true, "reportsEdit": true, "reportsDelete": true, "whatsapp": true, "settings": true, "settingsEdit": true, "users": true, "usersEdit": true, "usersDelete": true}'),

('supervisor1', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z8W4uDDNOPEXY0tCXxMrahZyHgSSO', 'المشرف الأول', 'supervisor', 
 '{"students": true, "studentsEdit": true, "studentsDelete": false, "classes": true, "classesEdit": true, "classesDelete": false, "teachers": true, "teachersEdit": true, "teachersDelete": false, "sessions": true, "sessionsEdit": true, "sessionsDelete": false, "attendance": true, "attendanceEdit": true, "attendanceDelete": false, "reports": true, "reportsEdit": true, "reportsDelete": false, "whatsapp": true, "settings": false, "settingsEdit": false, "users": false, "usersEdit": false, "usersDelete": false}'),

('supervisor2', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Z8W4uDDNOPEXY0tCXxMrahZyHgSSO', 'المشرف الثاني', 'supervisor', 
 '{"students": true, "studentsEdit": true, "studentsDelete": false, "classes": false, "classesEdit": false, "classesDelete": false, "teachers": false, "teachersEdit": false, "teachersDelete": false, "sessions": false, "sessionsEdit": false, "sessionsDelete": false, "attendance": true, "attendanceEdit": true, "attendanceDelete": false, "reports": false, "reportsEdit": false, "reportsDelete": false, "whatsapp": false, "settings": false, "settingsEdit": false, "users": false, "usersEdit": false, "usersDelete": false}');

-- إدراج المواد الدراسية مع ألوان
INSERT INTO subjects (name, description, color) VALUES
('الرياضيات', 'مادة الرياضيات للمراحل المختلفة', '#3B82F6'),
('العلوم', 'مادة العلوم الطبيعية', '#10B981'),
('اللغة العربية', 'مادة اللغة العربية والنحو', '#F59E0B'),
('اللغة الإنجليزية', 'مادة اللغة الإنجليزية', '#EF4444'),
('الفيزياء', 'مادة الفيزياء للمرحلة الثانوية', '#8B5CF6'),
('الكيمياء', 'مادة الكيمياء للمرحلة الثانوية', '#06B6D4'),
('الأحياء', 'مادة الأحياء للمرحلة الثانوية', '#84CC16'),
('التاريخ', 'مادة التاريخ والجغرافيا', '#F97316'),
('الحاسوب', 'مادة علوم الحاسوب والبرمجة', '#6366F1'),
('التربية الإسلامية', 'مادة التربية الإسلامية', '#14B8A6');

-- إدراج أماكن الحصص مع معدات
INSERT INTO locations (name, room_number, capacity, description, equipment) VALUES
('سنتر التفوق', 'A101', 30, 'قاعة مجهزة بأحدث التقنيات', 'بروجكتر، سبورة ذكية، مكيف'),
('سنتر المجد', 'B201', 25, 'قاعة للمجموعات الصغيرة', 'بروجكتر، سبورة بيضاء'),
('سنتر النجاح', 'C301', 35, 'قاعة كبيرة للمحاضرات', 'بروجكتر، نظام صوتي، مكيف'),
('القاعة الرئيسية', 'MAIN', 50, 'القاعة الرئيسية للفعاليات', 'نظام صوتي متكامل، إضاءة متقدمة'),
('المختبر العلمي', 'LAB1', 20, 'مختبر مجهز للتجارب العلمية', 'أدوات مختبر، خزائن أمان، شفاط'),
('قاعة الحاسوب', 'COMP1', 25, 'قاعة مجهزة بأجهزة الحاسوب', '25 جهاز حاسوب، شبكة إنترنت'),
('قاعة الفنون', 'ART1', 20, 'قاعة للأنشطة الفنية', 'طاولات رسم، أدوات فنية'),
('المكتبة', 'LIB1', 40, 'مكتبة للدراسة والبحث', 'كتب، طاولات دراسة، إنترنت');

-- إدراج المعلمين مع تخصصات
INSERT INTO teachers (name, subject_id, phone, email, specialization, experience_years) VALUES
('أحمد محمد علي', 1, '966501234567', 'ahmed.math@school.edu', 'رياضيات تطبيقية', 8),
('فاطمة عبدالله', 2, '966501234568', 'fatima.science@school.edu', 'علوم طبيعية', 6),
('محمد حسن', 3, '966501234569', 'mohammed.arabic@school.edu', 'أدب عربي', 10),
('نورا سالم', 4, '966501234570', 'nora.english@school.edu', 'لغة إنجليزية', 7),
('خالد أحمد', 5, '966501234571', 'khalid.physics@school.edu', 'فيزياء نظرية', 9),
('سارة محمود', 6, '966501234572', 'sara.chemistry@school.edu', 'كيمياء عضوية', 5),
('عبدالرحمن يوسف', 7, '966501234573', 'abdulrahman.biology@school.edu', 'أحياء جزيئية', 6),
('مريم خالد', 8, '966501234574', 'mariam.history@school.edu', 'تاريخ حديث', 8),
('يوسف عبدالله', 9, '966501234575', 'youssef.computer@school.edu', 'علوم حاسوب', 4),
('زينب محمد', 10, '966501234576', 'zainab.islamic@school.edu', 'دراسات إسلامية', 12);

-- إدراج الفصول مع مستويات دراسية
INSERT INTO classes (name, teacher_id, subject_id, max_capacity, grade_level) VALUES
('الصف الأول أ - رياضيات', 1, 1, 30, 'الأول الثانوي'),
('الصف الثاني ب - علوم', 2, 2, 25, 'الثاني الثانوي'),
('الصف الثالث ج - عربي', 3, 3, 28, 'الثالث الثانوي'),
('الصف الأول ب - إنجليزي', 4, 4, 30, 'الأول الثانوي'),
('الثانوي - فيزياء', 5, 5, 20, 'الثاني الثانوي'),
('الثانوي - كيمياء', 6, 6, 22, 'الثاني الثانوي'),
('الثانوي - أحياء', 7, 7, 24, 'الثالث الثانوي'),
('الصف الثاني أ - تاريخ', 8, 8, 26, 'الثاني الثانوي'),
('الثانوي - حاسوب', 9, 9, 20, 'الأول الثانوي'),
('الصف الأول ج - إسلامية', 10, 10, 32, 'الأول الثانوي');

-- إدراج الطلاب مع أرقام هواتف منسقة
INSERT INTO students (name, barcode, parent_phone, parent_email, class_id, emergency_contact, enrollment_date) VALUES
('أحمد محمد علي', 'STUD000001', '201002246668', 'parent1@email.com', 1, '201002246668', '2024-09-01'),
('فاطمة عبدالله', 'STUD000002', '201012345678', 'parent2@email.com', 1, '201012345678', '2024-09-01'),
('محمد خالد', 'STUD000003', '201023456789', 'parent3@email.com', 2, '201023456789', '2024-09-01'),
('نور حسن', 'STUD000004', '201034567890', 'parent4@email.com', 2, '201034567890', '2024-09-01'),
('عبدالرحمن سعد', 'STUD000005', '201045678901', 'parent5@email.com', 3, '201045678901', '2024-09-01'),
('سارة أحمد', 'STUD000006', '201056789012', 'parent6@email.com', 3, '201056789012', '2024-09-01'),
('علي محمود', 'STUD000007', '201067890123', 'parent7@email.com', 4, '201067890123', '2024-09-01'),
('مريم خالد', 'STUD000008', '201078901234', 'parent8@email.com', 4, '201078901234', '2024-09-01'),
('يوسف عبدالله', 'STUD000009', '966501234567', 'parent9@email.com', 5, '966501234567', '2024-09-01'),
('زينب محمد', 'STUD000010', '966501234568', 'parent10@email.com', 5, '966501234568', '2024-09-01'),
('حسام أحمد', 'STUD000011', '966501234569', 'parent11@email.com', 1, '966501234569', '2024-09-01'),
('ليلى محمود', 'STUD000012', '966501234570', 'parent12@email.com', 2, '966501234570', '2024-09-01'),
('عمر سالم', 'STUD000013', '966501234571', 'parent13@email.com', 3, '966501234571', '2024-09-01'),
('رنا عبدالله', 'STUD000014', '966501234572', 'parent14@email.com', 4, '966501234572', '2024-09-01'),
('طارق محمد', 'STUD000015', '966501234573', 'parent15@email.com', 5, '966501234573', '2024-09-01'),
('هدى علي', 'STUD000016', '201089012345', 'parent16@email.com', 6, '201089012345', '2024-09-01'),
('كريم حسن', 'STUD000017', '201090123456', 'parent17@email.com', 7, '201090123456', '2024-09-01'),
('نادية محمد', 'STUD000018', '201001234567', 'parent18@email.com', 8, '201001234567', '2024-09-01'),
('سامي أحمد', 'STUD000019', '966501234574', 'parent19@email.com', 9, '966501234574', '2024-09-01'),
('دينا خالد', 'STUD000020', '966501234575', 'parent20@email.com', 10, '966501234575', '2024-09-01');

-- إدراج جلسات تجريبية مع أنواع مختلفة
INSERT INTO sessions (class_id, location_id, start_time, end_time, status, session_type, created_by) VALUES
(1, 1, '2024-01-20 09:00:00', '2024-01-20 10:30:00', 'active', 'regular', 1),
(2, 2, '2024-01-20 11:00:00', '2024-01-20 12:30:00', 'active', 'regular', 1),
(3, 3, '2024-01-20 14:00:00', '2024-01-20 15:30:00', 'scheduled', 'regular', 1),
(4, 4, '2024-01-21 09:00:00', '2024-01-21 10:30:00', 'scheduled', 'exam', 1),
(5, 5, '2024-01-21 11:00:00', '2024-01-21 12:30:00', 'scheduled', 'regular', 1),
(1, 1, '2024-01-19 09:00:00', '2024-01-19 10:30:00', 'completed', 'regular', 1),
(2, 2, '2024-01-19 11:00:00', '2024-01-19 12:30:00', 'completed', 'regular', 1),
(6, 6, '2024-01-20 16:00:00', '2024-01-20 17:30:00', 'active', 'review', 1),
(7, 7, '2024-01-21 14:00:00', '2024-01-21 15:30:00', 'scheduled', 'regular', 1),
(8, 8, '2024-01-22 10:00:00', '2024-01-22 11:30:00', 'scheduled', 'makeup', 1),
(9, 1, '2024-01-22 14:00:00', '2024-01-22 15:30:00', 'scheduled', 'regular', 1),
(10, 2, '2024-01-23 09:00:00', '2024-01-23 10:30:00', 'scheduled', 'regular', 1);

-- إدراج سجلات حضور شاملة (تم تغيير timestamp إلى record_time)
INSERT INTO attendance (student_id, session_id, status, recorded_by, check_in_time) VALUES
-- الجلسة الأولى
(1, 1, 'present', 1, '09:05:00'),
(2, 1, 'present', 1, '09:02:00'),
(11, 1, 'absent', 1, NULL),
-- الجلسة الثانية
(3, 2, 'present', 1, '11:03:00'),
(4, 2, 'absent', 1, NULL),
(12, 2, 'late', 1, '11:15:00'),
-- الجلسة الثالثة
(5, 3, 'present', 1, '14:01:00'),
(6, 3, 'late', 1, '14:10:00'),
(13, 3, 'present', 1, '13:58:00'),
-- الجلسة المكتملة الأولى
(1, 6, 'present', 1, '09:00:00'),
(2, 6, 'present', 1, '09:03:00'),
(11, 6, 'present', 1, '09:07:00'),
-- الجلسة المكتملة الثانية
(3, 7, 'present', 1, '11:02:00'),
(4, 7, 'present', 1, '11:00:00'),
(12, 7, 'absent', 1, NULL);

-- إدراج تقارير أداء شاملة
INSERT INTO reports (student_id, session_id, teacher_rating, quiz_score, participation, behavior, homework, comments, strengths, areas_for_improvement, created_by) VALUES
(1, 1, 5, 95.5, 5, 'ممتاز', 'completed', 'طالب متميز ومتفاعل بشكل ممتاز', 'فهم سريع وحل ممتاز للمسائل الرياضية', 'يمكن تحسين سرعة الحل في الوقت المحدد', 1),
(2, 1, 4, 87.0, 4, 'جيد جداً', 'completed', 'أداء جيد يحتاج تحسين بسيط في التركيز', 'مشاركة جيدة في النقاش والحوار', 'يحتاج تركيز أكثر في التفاصيل الدقيقة', 1),
(3, 2, 5, 92.0, 5, 'ممتاز', 'completed', 'مشاركة فعالة وفهم ممتاز للمفاهيم العلمية', 'تفاعل ممتاز مع التجارب العملية', 'لا يوجد ملاحظات سلبية', 1),
(5, 3, 4, 88.5, 4, 'جيد', 'completed', 'يحتاج المزيد من التركيز في القراءة', 'قراءة جيدة وفهم للنصوص', 'تحسين الخط والإملاء والتعبير', 1),
(1, 6, 5, 98.0, 5, 'ممتاز', 'completed', 'أداء استثنائي في جميع جوانب المادة', 'حل إبداعي للمسائل المعقدة', 'لا يوجد مجالات تحتاج تحسين', 1),
(2, 6, 4, 85.0, 4, 'جيد جداً', 'completed', 'تحسن ملحوظ منذ بداية الفصل', 'زيادة في التركيز والانتباه', 'مراجعة الأساسيات بشكل دوري', 1),
(3, 7, 5, 94.0, 5, 'ممتاز', 'completed', 'فهم عميق للمادة وقدرة على التحليل', 'تحليل ممتاز للنصوص والمفاهيم', 'لا يوجد مجالات تحتاج تحسين', 1),
(4, 7, 3, 72.0, 3, 'مقبول', 'incomplete', 'يحتاج متابعة أكثر من ولي الأمر', 'محاولة جيدة في المشاركة', 'إكمال الواجبات والمراجعة المستمرة', 1),
(6, 3, 4, 89.0, 4, 'جيد جداً', 'completed', 'تحسن مستمر في الأداء', 'مشاركة نشطة في الأنشطة', 'تطوير مهارات الكتابة', 1),
(13, 3, 5, 96.0, 5, 'ممتاز', 'completed', 'طالب مثالي في جميع النواحي', 'قيادة المجموعة بشكل ممتاز', 'الاستمرار على نفس المستوى', 1);

-- إدراج قوالب رسائل الواتساب
INSERT INTO whatsapp_templates (name, type, template, variables, is_default, created_by) VALUES
('قالب الغياب الافتراضي', 'absence', 
'🔔 تنبيه غياب

عزيزي ولي الأمر،

نود إعلامكم بأن الطالب/ة: {studentName}
تغيب عن حصة اليوم

📚 تفاصيل الحصة:
• المادة: {subjectName}
• الفصل: {className}
• المعلم: {teacherName}
• التاريخ: {date}
• الوقت: {time}
• المكان: {locationName}

نرجو المتابعة والتواصل مع إدارة المدرسة لمعرفة سبب الغياب.

📞 للاستفسار: اتصل بإدارة المدرسة

📚 نظام إدارة الحضور', 
'["studentName", "subjectName", "className", "teacherName", "date", "time", "locationName"]', TRUE, 1),

('قالب تقرير الأداء الافتراضي', 'performance', 
'📊 تقرير أداء الطالب

عزيزي ولي الأمر،

تقرير أداء الطالب/ة: {studentName}
الجلسة: {subjectName}
الفصل: {className}
المعلم: {teacherName}
التاريخ: {date}

📈 التقييم:
⭐ تقييم المعلم: {teacherRating}/5
🙋 المشاركة: {participation}/5
😊 السلوك: {behavior}
📝 الواجب: {homework}
📋 درجة الاختبار: {quizScore}%

💬 ملاحظات المعلم:
{comments}

🌟 نقاط القوة:
{strengths}

📈 مجالات التحسين:
{areasForImprovement}

📚 نظام إدارة الحضور
شكراً لمتابعتكم المستمرة 🌟', 
'["studentName", "subjectName", "className", "teacherName", "date", "teacherRating", "participation", "behavior", "homework", "quizScore", "comments", "strengths", "areasForImprovement"]', TRUE, 1),

('قالب تأكيد الحضور', 'attendance', 
'✅ تأكيد حضور

عزيزي ولي الأمر،

نود إعلامكم بحضور الطالب/ة: {studentName}
في حصة اليوم

📚 تفاصيل الحصة:
• المادة: {subjectName}
• الفصل: {className}
• المعلم: {teacherName}
• التاريخ: {date}
• الوقت: {time}
• المكان: {locationName}

📚 نظام إدارة الحضور', 
'["studentName", "subjectName", "className", "teacherName", "date", "time", "locationName"]', TRUE, 1),

('قالب التذكير', 'reminder', 
'⏰ تذكير بالحصة

عزيزي ولي الأمر،

تذكير: لديكم حصة {subjectName} غداً
الفصل: {className}
الوقت: {time}
المكان: {locationName}

نتطلع لحضور الطالب/ة {studentName}

📚 نظام إدارة الحضور', 
'["studentName", "subjectName", "className", "time", "locationName"]', TRUE, 1),

('قالب الإعلان العام', 'announcement', 
'📢 إعلان مهم

{message}

📚 نظام إدارة الحضور', 
'["message"]', TRUE, 1);

-- إدراج إعدادات النظام المحدثة
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, category, is_public) VALUES
-- إعدادات الواتساب
('whatsapp_enabled', 'true', 'boolean', 'تفعيل خدمة الواتساب', 'whatsapp', FALSE),
('whatsapp_session_name', 'attendance-system', 'string', 'اسم جلسة الواتساب', 'whatsapp', FALSE),
('whatsapp_max_messages_per_minute', '15', 'number', 'الحد الأقصى للرسائل في الدقيقة', 'whatsapp', FALSE),
('whatsapp_message_delay', '3000', 'number', 'التأخير بين الرسائل بالميلي ثانية', 'whatsapp', FALSE),

-- إعدادات الجلسات
('default_session_duration', '90', 'number', 'مدة الجلسة الافتراضية بالدقائق', 'sessions', TRUE),
('session_reminder_time', '24', 'number', 'وقت التذكير قبل الجلسة بالساعات', 'sessions', TRUE),
('max_sessions_per_day', '8', 'number', 'الحد الأقصى للجلسات في اليوم', 'sessions', TRUE),

-- إعدادات الحضور
('attendance_grace_period', '15', 'number', 'فترة السماح للحضور بالدقائق', 'attendance', TRUE),
('auto_mark_absent_after', '30', 'number', 'تسجيل الغياب تلقائياً بعد دقائق من بداية الجلسة', 'attendance', TRUE),
('attendance_notification_enabled', 'true', 'boolean', 'تفعيل إشعارات الحضور', 'attendance', TRUE),

-- إعدادات الطلاب
('barcode_prefix', 'STUD', 'string', 'بادئة رمز الطالب', 'students', FALSE),
('auto_generate_barcode', 'true', 'boolean', 'توليد الباركود تلقائياً', 'students', FALSE),
('student_id_format', 'STUD{number:6}', 'string', 'تنسيق رقم الطالب', 'students', FALSE),

-- إعدادات النظام العامة
('system_name', 'نظام إدارة الحضور الشامل', 'string', 'اسم النظام', 'general', TRUE),
('school_name', 'مدرسة المستقبل', 'string', 'اسم المدرسة', 'general', TRUE),
('admin_email', 'admin@attendance.local', 'string', 'بريد المدير الإلكتروني', 'general', FALSE),
('academic_year', '2024-2025', 'string', 'السنة الدراسية الحالية', 'general', TRUE),
('timezone', 'Asia/Riyadh', 'string', 'المنطقة الزمنية', 'general', TRUE),

-- إعدادات الأمان
('session_timeout', '24', 'number', 'انتهاء صلاحية الجلسة بالساعات', 'security', FALSE),
('max_login_attempts', '5', 'number', 'الحد الأقصى لمحاولات تسجيل الدخول', 'security', FALSE),
('account_lockout_duration', '30', 'number', 'مدة قفل الحساب بالدقائق', 'security', FALSE),
('password_min_length', '6', 'number', 'الحد الأدنى لطول كلمة المرور', 'security', FALSE),

-- إعدادات التقارير
('report_retention_days', '365', 'number', 'مدة الاحتفاظ بالتقارير بالأيام', 'reports', FALSE),
('auto_generate_reports', 'true', 'boolean', 'توليد التقارير تلقائياً', 'reports', TRUE),
('report_email_notifications', 'false', 'boolean', 'إرسال التقارير بالبريد الإلكتروني', 'reports', TRUE);

-- إدراج بعض سجلات النشاط التجريبية
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, new_values, ip_address) VALUES
(1, 'CREATE', 'student', 1, '{"name": "أحمد محمد علي", "barcode": "STUD000001"}', '127.0.0.1'),
(1, 'CREATE', 'session', 1, '{"class_id": 1, "status": "active"}', '127.0.0.1'),
(1, 'UPDATE', 'session', 1, '{"status": "completed"}', '127.0.0.1'),
(2, 'CREATE', 'attendance', 1, '{"student_id": 1, "session_id": 1, "status": "present"}', '127.0.0.1'),
(2, 'CREATE', 'report', 1, '{"student_id": 1, "session_id": 1, "teacher_rating": 5}', '127.0.0.1');

-- إنشاء Views مفيدة للتقارير
CREATE VIEW student_attendance_summary AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.barcode,
    c.name as class_name,
    COUNT(a.id) as total_sessions,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) as excused_count,
    ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 2) as attendance_rate
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN attendance a ON s.id = a.student_id
WHERE s.is_active = TRUE
GROUP BY s.id, s.name, s.barcode, c.name;

CREATE VIEW session_statistics AS
SELECT 
    se.id as session_id,
    c.name as class_name,
    sub.name as subject_name,
    t.name as teacher_name,
    l.name as location_name,
    se.start_time,
    se.end_time,
    se.status,
    COUNT(a.id) as total_attendance,
    SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
    SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
    ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 2) as attendance_rate
FROM sessions se
JOIN classes c ON se.class_id = c.id
LEFT JOIN subjects sub ON c.subject_id = sub.id
LEFT JOIN teachers t ON c.teacher_id = t.id
LEFT JOIN locations l ON se.location_id = l.id
LEFT JOIN attendance a ON se.id = a.session_id
GROUP BY se.id, c.name, sub.name, t.name, l.name, se.start_time, se.end_time, se.status;

-- إنشاء Stored Procedures مفيدة
DELIMITER //

CREATE PROCEDURE GetStudentPerformance(IN student_id INT, IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        r.*,
        s.name as student_name,
        se.start_time as session_date,
        c.name as class_name,
        sub.name as subject_name,
        t.name as teacher_name
    FROM reports r
    JOIN students s ON r.student_id = s.id
    JOIN sessions se ON r.session_id = se.id
    JOIN classes c ON se.class_id = c.id
    LEFT JOIN subjects sub ON c.subject_id = sub.id
    LEFT JOIN teachers t ON c.teacher_id = t.id
    WHERE r.student_id = student_id
    AND DATE(se.start_time) BETWEEN start_date AND end_date
    ORDER BY se.start_time DESC;
END //

CREATE PROCEDURE GetClassAttendanceReport(IN class_id INT, IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        s.name as student_name,
        s.barcode,
        COUNT(a.id) as total_sessions,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as late_count,
        ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 2) as attendance_rate
    FROM students s
    LEFT JOIN attendance a ON s.id = a.student_id
    LEFT JOIN sessions se ON a.session_id = se.id
    WHERE s.class_id = class_id
    AND s.is_active = TRUE
    AND (start_date IS NULL OR DATE(a.record_time) >= start_date)
    AND (end_date IS NULL OR DATE(a.record_time) <= end_date)
    GROUP BY s.id, s.name, s.barcode
    ORDER BY s.name;
END //

DELIMITER ;

-- إنشاء Triggers للتدقيق
DELIMITER //

CREATE TRIGGER users_audit_trigger
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_values, new_values)
    VALUES (NEW.id, 'UPDATE', 'user', NEW.id, 
            JSON_OBJECT('name', OLD.name, 'role', OLD.role, 'permissions', OLD.permissions),
            JSON_OBJECT('name', NEW.name, 'role', NEW.role, 'permissions', NEW.permissions));
END //

CREATE TRIGGER attendance_audit_trigger
AFTER INSERT ON attendance
FOR EACH ROW
BEGIN
    INSERT INTO activity_logs (user_id, action, entity_type, entity_id, new_values)
    VALUES (NEW.recorded_by, 'CREATE', 'attendance', NEW.id,
            JSON_OBJECT('student_id', NEW.student_id, 'session_id', NEW.session_id, 'status', NEW.status));
END //

DELIMITER ;

-- رسالة النجاح
SELECT 'تم إنشاء قاعدة البيانات المُصححة بنجاح!' as message,
       'متوافقة 100% مع MySQL/MariaDB' as compatibility,
       'تم إصلاح جميع مشاكل الفهارس والكلمات المحجوزة' as fixes,
       'جاهزة للاستخدام الفوري' as status;

-- عرض إحصائيات قاعدة البيانات
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM classes) as total_classes,
    (SELECT COUNT(*) FROM teachers) as total_teachers,
    (SELECT COUNT(*) FROM sessions) as total_sessions,
    (SELECT COUNT(*) FROM attendance) as total_attendance_records,
    (SELECT COUNT(*) FROM reports) as total_reports,
    (SELECT COUNT(*) FROM whatsapp_templates) as total_whatsapp_templates,
    (SELECT COUNT(*) FROM system_settings) as total_settings;