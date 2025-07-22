const express = require('express');
const cors = require('cors');
const venom = require('venom-bot');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.WHATSAPP_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// إعدادات قاعدة البيانات
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'attendance_system',
    charset: 'utf8mb4'
};

let whatsappClient = null;
let isConnected = false;

// تهيئة الواتساب
async function initializeWhatsApp() {
    try {
        console.log('🚀 بدء تهيئة الواتساب...');
        
        whatsappClient = await venom.create(
            'attendance-system',
            (base64Qr, asciiQR, attempts, urlCode) => {
                console.log('📱 QR Code - المحاولة:', attempts);
                console.log('\n' + asciiQR + '\n');
                console.log('🔗 URL Code:', urlCode);
            },
            (statusSession, session) => {
                console.log('📊 حالة الجلسة:', statusSession);
                if (statusSession === 'isLogged') {
                    isConnected = true;
                    console.log('✅ تم الاتصال بالواتساب بنجاح!');
                }
            },
            {
                folderNameToken: './tokens',
                headless: true,
                devtools: false,
                useChrome: true,
                debug: false,
                logQR: true,
                puppeteerOptions: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu'
                    ]
                },
                autoClose: 0,
                createPathFileToken: true
            }
        );
        
        console.log('🎉 تم تهيئة الواتساب بنجاح!');
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة الواتساب:', error);
        return false;
    }
}

// تنسيق رقم الهاتف
function formatPhoneNumber(phoneNumber) {
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // دعم الأرقام المصرية والسعودية
    if (!cleaned.startsWith('20') && !cleaned.startsWith('966')) {
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        if (cleaned.startsWith('1') && cleaned.length >= 9) {
            cleaned = '20' + cleaned; // رقم مصري
        } else if (cleaned.startsWith('5') && cleaned.length === 9) {
            cleaned = '966' + cleaned; // رقم سعودي
        }
    }
    
    return cleaned + '@c.us';
}

// API Routes

// حالة الاتصال
app.get('/status', (req, res) => {
    res.json({
        success: true,
        connected: isConnected,
        timestamp: new Date().toISOString()
    });
});

// إرسال رسالة واحدة
app.post('/send-message', async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        if (!isConnected || !whatsappClient) {
            return res.status(400).json({
                success: false,
                error: 'الواتساب غير متصل'
            });
        }
        
        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'رقم الهاتف والرسالة مطلوبان'
            });
        }
        
        const formattedNumber = formatPhoneNumber(phone);
        const testMessage = message || `🧪 رسالة اختبار من نظام إدارة الحضور\n\nهذه رسالة اختبار للتأكد من عمل النظام.\n\nالوقت: ${new Date().toLocaleString('ar-EG')}\n\n📚 نظام إدارة الحضور`;
        
        console.log(`📤 إرسال رسالة إلى: ${phone} (${formattedNumber})`);
        
        const result = await whatsappClient.sendText(formattedNumber, testMessage);
        
        console.log('✅ تم إرسال الرسالة بنجاح:', result.id);
        
        res.json({
            success: true,
            messageId: result.id,
            message: 'تم إرسال الرسالة بنجاح'
        });
        
    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// إرسال تقرير جلسة
app.post('/send-session-report', async (req, res) => {
    try {
        const { session_id } = req.body;
        
        if (!isConnected || !whatsappClient) {
            return res.status(400).json({
                success: false,
                error: 'الواتساب غير متصل'
            });
        }
        
        if (!session_id) {
            return res.status(400).json({
                success: false,
                error: 'معرف الجلسة مطلوب'
            });
        }
        
        // الاتصال بقاعدة البيانات
        const connection = await mysql.createConnection(dbConfig);
        
        // جلب بيانات الجلسة
        const [sessionRows] = await connection.execute(`
            SELECT s.*, c.name as class_name, t.name as teacher_name, 
                   sub.name as subject_name, l.name as location_name
            FROM sessions s
            JOIN classes c ON s.class_id = c.id
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN subjects sub ON c.subject_id = sub.id
            LEFT JOIN locations l ON s.location_id = l.id
            WHERE s.id = ?
        `, [session_id]);
        
        if (sessionRows.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                error: 'الجلسة غير موجودة'
            });
        }
        
        const session = sessionRows[0];
        
        // جلب طلاب الفصل مع الحضور والتقارير
        const [students] = await connection.execute(`
            SELECT s.id, s.name, s.parent_phone,
                   a.status as attendance_status,
                   r.teacher_rating, r.quiz_score, r.participation, 
                   r.behavior, r.homework, r.comments
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.session_id = ?
            LEFT JOIN reports r ON s.id = r.student_id AND r.session_id = ?
            WHERE s.class_id = ? AND s.is_active = 1 
            AND s.parent_phone IS NOT NULL AND s.parent_phone != ''
            ORDER BY s.name
        `, [session_id, session_id, session.class_id]);
        
        console.log(`👥 عدد الطلاب: ${students.length}`);
        
        let sentCount = 0;
        let failedCount = 0;
        const results = [];
        
        const sessionDate = new Date(session.start_time).toLocaleDateString('ar-EG');
        const sessionTime = new Date(session.start_time).toLocaleTimeString('ar-EG', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        for (const student of students) {
            try {
                let message = '';
                let messageType = '';
                
                const hasAttendance = student.attendance_status && student.attendance_status !== 'absent';
                const hasReport = student.teacher_rating && student.participation;
                
                if (!hasAttendance) {
                    // رسالة غياب
                    message = `🔔 تنبيه غياب\n\nعزيزي ولي الأمر،\n\nنود إعلامكم بأن الطالب/ة: ${student.name}\nتغيب عن حصة اليوم\n\n📚 تفاصيل الحصة:\n• المادة: ${session.subject_name || 'غير محدد'}\n• الفصل: ${session.class_name}\n• المعلم: ${session.teacher_name || 'غير محدد'}\n• التاريخ: ${sessionDate}\n• الوقت: ${sessionTime}\n\nنرجو المتابعة والتواصل مع إدارة المدرسة.\n\n📚 نظام إدارة الحضور`;
                    messageType = 'absence';
                } else if (hasAttendance && hasReport) {
                    // تقرير أداء
                    message = `📊 تقرير أداء الطالب\n\nعزيزي ولي الأمر،\n\nتقرير أداء الطالب/ة: ${student.name}\nالمادة: ${session.subject_name || 'غير محدد'}\nالفصل: ${session.class_name}\nالمعلم: ${session.teacher_name || 'غير محدد'}\nالتاريخ: ${sessionDate}\n\n📈 التقييم:\n⭐ تقييم المعلم: ${student.teacher_rating}/5\n🙋 المشاركة: ${student.participation}/5\n😊 السلوك: ${student.behavior || 'غير محدد'}\n📝 الواجب: ${student.homework === 'completed' ? 'مكتمل ✅' : 'غير مكتمل ❌'}`;
                    
                    if (student.quiz_score) {
                        message += `\n📋 درجة الاختبار: ${student.quiz_score}%`;
                    }
                    
                    if (student.comments) {
                        message += `\n\n💬 ملاحظات المعلم:\n${student.comments}`;
                    }
                    
                    message += `\n\n📚 نظام إدارة الحضور\nشكراً لمتابعتكم 🌟`;
                    messageType = 'performance';
                } else {
                    // رسالة حضور
                    message = `✅ تأكيد حضور\n\nعزيزي ولي الأمر،\n\nنود إعلامكم بحضور الطالب/ة: ${student.name}\nفي حصة اليوم\n\n📚 تفاصيل الحصة:\n• المادة: ${session.subject_name || 'غير محدد'}\n• الفصل: ${session.class_name}\n• المعلم: ${session.teacher_name || 'غير محدد'}\n• التاريخ: ${sessionDate}\n• الوقت: ${sessionTime}\n\n📚 نظام إدارة الحضور`;
                    messageType = 'attendance';
                }
                
                const formattedNumber = formatPhoneNumber(student.parent_phone);
                const result = await whatsappClient.sendText(formattedNumber, message);
                
                // تسجيل في قاعدة البيانات
                await connection.execute(
                    'INSERT INTO whatsapp_logs (student_id, session_id, message_type, message, phone_number, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [student.id, session_id, messageType, message, student.parent_phone, 'sent']
                );
                
                sentCount++;
                results.push({
                    student: student.name,
                    phone: student.parent_phone,
                    success: true,
                    messageType
                });
                
                console.log(`✅ تم إرسال رسالة ${messageType} للطالب: ${student.name}`);
                
                // انتظار بين الرسائل
                await new Promise(resolve => setTimeout(resolve, 3000));
                
            } catch (error) {
                console.error(`❌ خطأ في إرسال رسالة للطالب ${student.name}:`, error);
                
                // تسجيل الخطأ
                await connection.execute(
                    'INSERT INTO whatsapp_logs (student_id, session_id, message_type, message, phone_number, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [student.id, session_id, messageType || 'unknown', message || '', student.parent_phone, 'failed', error.message]
                );
                
                failedCount++;
                results.push({
                    student: student.name,
                    phone: student.parent_phone,
                    success: false,
                    error: error.message
                });
            }
        }
        
        await connection.end();
        
        console.log(`📊 ملخص الإرسال: ${sentCount} نجح، ${failedCount} فشل`);
        
        res.json({
            success: true,
            total: students.length,
            sent: sentCount,
            failed: failedCount,
            results
        });
        
    } catch (error) {
        console.error('❌ خطأ في إرسال تقرير الجلسة:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// بدء الخادم
app.listen(PORT, async () => {
    console.log(`🚀 خدمة الواتساب تعمل على المنفذ ${PORT}`);
    console.log('🔄 بدء تهيئة الواتساب...');
    
    // تهيئة الواتساب عند بدء الخادم
    await initializeWhatsApp();
});

// معالجة إغلاق التطبيق
process.on('SIGINT', async () => {
    console.log('\n🛑 إيقاف خدمة الواتساب...');
    if (whatsappClient) {
        await whatsappClient.close();
    }
    process.exit(0);
});