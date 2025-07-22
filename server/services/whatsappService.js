const venom = require('venom-bot');
const { executeQuery } = require('../config/database');
const path = require('path');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isInitializing = false;
    this.qrCode = null;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.reconnectInterval = null;
    this.statusCheckInterval = null;
    this.lastActivity = Date.now();
    this.connectionTimeout = 5 * 60 * 1000; // 5 دقائق
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⏳ الواتساب قيد التهيئة بالفعل...');
      return { success: false, message: 'جاري التهيئة بالفعل...' };
    }

    if (this.isConnected && this.client) {
      console.log('✅ الواتساب متصل بالفعل');
      return { success: true, message: 'الواتساب متصل بالفعل' };
    }

    this.isInitializing = true;
    this.stopStatusCheck(); // إيقاف أي فحص سابق

    try {
      console.log('🚀 بدء تهيئة الواتساب...');
      
      // تنظيف الاتصال السابق إن وجد
      await this.cleanup();
      
      this.client = await venom.create(
        'attendance-system',
        (base64Qr, asciiQR, attempts, urlCode) => {
          console.log(`📱 QR Code جديد - المحاولة: ${attempts}`);
          console.log('🔗 URL Code:', urlCode);
          console.log('\n' + asciiQR + '\n');
          this.qrCode = base64Qr;
          
          if (attempts >= 5) {
            console.log('⚠️ تم الوصول للحد الأقصى من محاولات QR Code');
          }
          
          console.log('\n📋 خطوات المسح:');
          console.log('1. افتح واتساب على هاتفك');
          console.log('2. اذهب إلى: الإعدادات > الأجهزة المرتبطة');
          console.log('3. اضغط على "ربط جهاز"');
          console.log('4. امسح QR Code أعلاه');
          console.log('5. انتظر رسالة التأكيد\n');
        },
        (statusSession, session) => {
          console.log(`📊 تغيير حالة الجلسة: ${statusSession}`);
          console.log(`📱 اسم الجلسة: ${session}`);
          
          switch (statusSession) {
            case 'isLogged':
            case 'qrReadSuccess':
            case 'chatsAvailable':
              this.isConnected = true;
              this.isInitializing = false;
              this.connectionRetries = 0;
              this.lastActivity = Date.now();
              console.log('✅ تم الاتصال بالواتساب بنجاح!');
              this.startStatusCheck();
              break;
            case 'notLogged':
              this.isConnected = false;
              console.log('❌ لم يتم تسجيل الدخول');
              break;
            case 'browserClose':
              this.isConnected = false;
              console.log('🔒 تم إغلاق المتصفح');
              this.handleDisconnection();
              break;
            case 'qrReadFail':
              console.log('❌ فشل في مسح QR Code');
              break;
            case 'autocloseCalled':
              console.log('🔄 تم استدعاء الإغلاق التلقائي');
              this.handleDisconnection();
              break;
            case 'desconnectedMobile':
              console.log('📱 انقطع الاتصال من الهاتف');
              this.handleDisconnection();
              break;
            default:
              console.log(`ℹ️ حالة غير معروفة: ${statusSession}`);
          }
        },
        {
          folderNameToken: './tokens',
          mkdirFolderToken: '',
          headless: 'new',
          devtools: false,
          useChrome: true,
          debug: false,
          logQR: true,
          puppeteerOptions: {
            headless: 'new',
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--disable-gpu',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-field-trial-config',
              '--disable-back-forward-cache',
              '--disable-features=TranslateUI',
              '--disable-ipc-flooding-protection',
              '--memory-pressure-off',
              '--max_old_space_size=4096',
              '--disable-extensions',
              '--disable-plugins',
              '--disable-default-apps',
              '--disable-background-networking',
              // إعدادات إضافية للإنتاج على Render
              '--disable-dev-shm-usage',
              '--disable-software-rasterizer',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-features=TranslateUI',
              '--disable-ipc-flooding-protection'
            ],
            executablePath: process.env.CHROME_PATH || (process.env.NODE_ENV === 'production' ? '/usr/bin/google-chrome' : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'),
            defaultViewport: null,
            ignoreHTTPSErrors: true,
            slowMo: 0
          },
          autoClose: 0, // عدم الإغلاق التلقائي
          createPathFileToken: true,
          waitForLogin: true,
          disableSpins: true,
          disableWelcome: true,
          timeout: 120000, // دقيقتان
          messageSettings: {
            maxPerMinute: 15,
            delay: 4000,
            retryDelay: 5000,
            maxRetries: 3
          }
        }
      );
      
      if (this.client) {
        // إعداد معالجات الأحداث
        this.setupEventHandlers();
        
        // انتظار حتى يتم الاتصال أو انتهاء المهلة الزمنية
        const timeout = 120000; // دقيقتان
        const startTime = Date.now();
        
        while (!this.isConnected && (Date.now() - startTime) < timeout && this.isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (this.isConnected) {
          console.log('🎉 تم تهيئة الواتساب بنجاح!');
          this.startStatusCheck();
          return { success: true, message: 'تم تهيئة الواتساب بنجاح!' };
        } else {
          this.isInitializing = false;
          return { success: false, message: 'انتهت المهلة الزمنية للاتصال. يرجى المحاولة مرة أخرى.' };
        }
      }
      
      this.isInitializing = false;
      return { success: false, message: 'فشل في إنشاء جلسة الواتساب' };
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الواتساب:', error);
      this.isInitializing = false;
      this.isConnected = false;
      
      // إعادة المحاولة في حالة الفشل
      if (this.connectionRetries < this.maxRetries) {
        this.connectionRetries++;
        console.log(`🔄 إعادة المحاولة ${this.connectionRetries}/${this.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.initialize();
      }
      
      return { 
        success: false, 
        message: `خطأ في تهيئة الواتساب: ${error.message}` 
      };
    }
  }

  setupEventHandlers() {
    if (!this.client) return;

    try {
      // معالج الرسائل الواردة
      this.client.onMessage(async (message) => {
        this.lastActivity = Date.now();
        console.log('📨 رسالة واردة:', message.from);
      });

      // معالج حالة الاتصال
      this.client.onStateChange((state) => {
        console.log('🔄 تغيير حالة الاتصال:', state);
        this.lastActivity = Date.now();
        
        if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
          console.log('⚠️ تعارض في الاتصال، محاولة إعادة الاتصال...');
          this.handleDisconnection();
        } else if (state === 'CONNECTED') {
          this.isConnected = true;
          this.connectionRetries = 0;
        }
      });

      // معالج قطع الاتصال
      this.client.onStreamChange((state) => {
        console.log('📡 تغيير حالة البث:', state);
        this.lastActivity = Date.now();
        
        if (state === 'DISCONNECTED') {
          console.log('📡 انقطع البث، محاولة إعادة الاتصال...');
          this.handleDisconnection();
        }
      });

      // معالج إغلاق الجلسة
      this.client.onIncomingCall((call) => {
        console.log('📞 مكالمة واردة:', call);
        this.lastActivity = Date.now();
      });

    } catch (error) {
      console.error('❌ خطأ في إعداد معالجات الأحداث:', error);
    }
  }

  startStatusCheck() {
    this.stopStatusCheck();
    
    this.statusCheckInterval = setInterval(async () => {
      try {
        if (!this.client) {
          this.isConnected = false;
          return;
        }

        // فحص حالة الاتصال
        const state = await this.client.getConnectionState();
        const isActive = state === 'CONNECTED' || state === 'OPENING' || state === 'OPEN';
        
        if (!isActive) {
          console.log('⚠️ الاتصال غير نشط:', state);
          this.handleDisconnection();
          return;
        }

        // فحص النشاط الأخير
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        if (timeSinceLastActivity > this.connectionTimeout) {
          console.log('⏰ انتهت مهلة النشاط، إعادة تعيين الاتصال...');
          this.handleDisconnection();
          return;
        }

        // فحص صحة الجلسة
        try {
          await this.client.getHostDevice();
          this.lastActivity = Date.now();
        } catch (error) {
          console.log('❌ فشل فحص صحة الجلسة:', error.message);
          this.handleDisconnection();
        }

      } catch (error) {
        console.error('❌ خطأ في فحص حالة الاتصال:', error);
        this.handleDisconnection();
      }
    }, 30000); // كل 30 ثانية
  }

  stopStatusCheck() {
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval);
      this.statusCheckInterval = null;
    }
  }

  handleDisconnection() {
    console.log('🔄 معالجة انقطاع الاتصال...');
    this.isConnected = false;
    this.stopStatusCheck();
    
    // محاولة إعادة الاتصال التلقائي
    if (this.connectionRetries < this.maxRetries) {
      this.connectionRetries++;
      console.log(`🔄 محاولة إعادة الاتصال ${this.connectionRetries}/${this.maxRetries}...`);
      
      setTimeout(() => {
        this.initialize();
      }, 10000); // انتظار 10 ثواني قبل إعادة المحاولة
    } else {
      console.log('❌ فشل في إعادة الاتصال بعد عدة محاولات');
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isConnected || !this.client) {
      throw new Error('الواتساب غير متصل. يرجى التهيئة أولاً.');
    }

    try {
      // التحقق من حالة الاتصال قبل الإرسال
      const state = await this.client.getConnectionState();
      if (state !== 'CONNECTED') {
        throw new Error('الاتصال غير مستقر. يرجى إعادة التهيئة.');
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      console.log(`📤 إرسال رسالة إلى ${formattedNumber}`);
      
      // محاولة الإرسال مباشرة بدون التحقق من صحة الرقم
      // لأن checkNumberStatus أحياناً يعطي نتائج خاطئة
      console.log(`📱 محاولة إرسال رسالة إلى: ${phoneNumber} (${formattedNumber})`);
      
      const result = await this.client.sendText(formattedNumber, message);
      console.log('✅ تم إرسال الرسالة بنجاح:', result.id);
      
      this.lastActivity = Date.now();
      
      // انتظار قصير بين الرسائل لتجنب الحظر
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        success: true,
        messageId: result.id,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال الرسالة:', error);
      
      // تحسين رسائل الخطأ
      let errorMessage = error.message;
      
      if (error.message.includes('number not exists')) {
        errorMessage = `الرقم ${phoneNumber} غير مسجل في الواتساب`;
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'تم تجاوز حد الإرسال، يرجى المحاولة لاحقاً';
      } else if (error.message.includes('blocked')) {
        errorMessage = 'تم حظر الحساب مؤقتاً';
      } else if (error.message.includes('Session closed')) {
        errorMessage = 'انقطع الاتصال بالواتساب';
      }
      
      // في حالة خطأ الاتصال، محاولة إعادة التهيئة
      if (error.message.includes('Session closed') || error.message.includes('not opened')) {
        console.log('🔄 محاولة إعادة التهيئة بسبب خطأ الجلسة...');
        this.handleDisconnection();
      }
      
      throw new Error(errorMessage);
    }
  }

  // دالة اختبار إرسال رسالة واحدة
  async testMessage(phoneNumber, message = null) {
    try {
      const testMsg = message || `🧪 رسالة اختبار من نظام إدارة الحضور\n\nهذه رسالة اختبار للتأكد من عمل النظام.\n\nالوقت: ${new Date().toLocaleString('en-GB')}\n\n📚 نظام إدارة الحضور`;
      
      console.log(`🧪 اختبار إرسال رسالة إلى: ${phoneNumber}`);
      const result = await this.sendMessage(phoneNumber, testMsg);
      
      return {
        success: true,
        message: 'تم إرسال رسالة الاختبار بنجاح',
        messageId: result.messageId
      };
    } catch (error) {
      console.error('❌ فشل اختبار الرسالة:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendSessionReport(sessionId) {
    try {
      console.log('📊 بدء إرسال تقرير الجلسة:', sessionId);
      
      // التحقق من حالة الاتصال
      if (!this.isConnected || !this.client) {
        throw new Error('الواتساب غير متصل. يرجى التهيئة أولاً.');
      }

      // التحقق من حالة الاتصال الفعلية
      try {
        const state = await this.client.getConnectionState();
        if (state !== 'CONNECTED') {
          throw new Error('الاتصال غير مستقر. يرجى إعادة التهيئة.');
        }
      } catch (error) {
        console.error('❌ خطأ في فحص حالة الاتصال:', error);
        this.handleDisconnection();
        throw new Error('فقد الاتصال بالواتساب. يرجى إعادة التهيئة.');
      }
      
      // الحصول على بيانات الجلسة
      const sessionQuery = `
        SELECT s.*, c.name as class_name, t.name as teacher_name, 
               sub.name as subject_name, l.name as location_name
        FROM sessions s
        JOIN classes c ON s.class_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN subjects sub ON c.subject_id = sub.id
        LEFT JOIN locations l ON s.location_id = l.id
        WHERE s.id = ?
      `;
      
      const sessionResults = await executeQuery(sessionQuery, [sessionId]);
      if (sessionResults.length === 0) {
        throw new Error('الجلسة غير موجودة');
      }
      
      const session = sessionResults[0];
      console.log('📋 بيانات الجلسة:', session.class_name, session.teacher_name);
      
      // الحصول على طلاب الفصل مع حالة الحضور والتقارير
      const studentsQuery = `
        SELECT s.id, s.name, s.parent_phone, s.barcode,
               a.status as attendance_status,
               r.teacher_rating, r.quiz_score, r.participation, 
               r.behavior, r.homework, r.comments
        FROM students s
        LEFT JOIN attendance a ON s.id = a.student_id AND a.session_id = ?
        LEFT JOIN reports r ON s.id = r.student_id AND r.session_id = ?
        WHERE s.class_id = ? AND s.is_active = TRUE AND s.parent_phone IS NOT NULL AND s.parent_phone != ''
        ORDER BY s.name
      `;
      
      const students = await executeQuery(studentsQuery, [sessionId, sessionId, session.class_id]);
      console.log(`👥 عدد الطلاب المؤهلين للإرسال: ${students.length}`);
      
      const results = [];
      const sessionDate = new Date(session.start_time).toLocaleDateString('en-GB');
      const sessionTime = new Date(session.start_time).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      let sentCount = 0;
      let failedCount = 0;
      
      for (const student of students) {
        console.log(`📱 معالجة الطالب: ${student.name} - ${student.parent_phone}`);
        
        let message = '';
        let messageType = '';
        
        // التحقق من حالة الحضور والتقرير
        const hasAttendance = student.attendance_status && student.attendance_status !== 'absent';
        const hasReport = student.teacher_rating && student.participation;
        
        if (!hasAttendance) {
          // رسالة غياب
          message = `🔔 تنبيه غياب\n\nعزيزي ولي الأمر،\n\nنود إعلامكم بأن الطالب/ة: ${student.name}\nتغيب عن حصة اليوم\n\n📚 تفاصيل الحصة:\n• المادة: ${session.subject_name || 'غير محدد'}\n• الفصل: ${session.class_name}\n• المعلم: ${session.teacher_name || 'غير محدد'}\n• التاريخ: ${sessionDate}\n• الوقت: ${sessionTime}${session.location_name ? `\n• المكان: ${session.location_name}` : ''}\n\nنرجو المتابعة والتواصل مع إدارة المدرسة لمعرفة سبب الغياب.\n\n📞 للاستفسار: اتصل بإدارة المدرسة\n\n📚 نظام إدارة الحضور`;
          messageType = 'absence';
        } else if (hasAttendance && hasReport) {
          // تقرير أداء
          message = `📊 تقرير أداء الطالب\n\nعزيزي ولي الأمر،\n\nتقرير أداء الطالب/ة: ${student.name}\nالجلسة: ${session.subject_name || 'غير محدد'}\nالفصل: ${session.class_name}\nالمعلم: ${session.teacher_name || 'غير محدد'}\nالتاريخ: ${sessionDate}\n\n📈 التقييم:\n⭐ تقييم المعلم: ${student.teacher_rating}/5\n🙋 المشاركة: ${student.participation}/5\n😊 السلوك: ${student.behavior || 'غير محدد'}\n📝 الواجب: ${student.homework === 'completed' ? 'مكتمل ✅' : student.homework === 'incomplete' ? 'غير مكتمل ❌' : 'جزئي ⚠️'}`;
          
          if (student.quiz_score) {
            message += `\n📋 درجة الاختبار: ${student.quiz_score}%`;
          }
          
          if (student.comments) {
            message += `\n\n💬 ملاحظات المعلم:\n${student.comments}`;
          }
          
          message += `\n\n📚 نظام إدارة الحضور\nشكراً لمتابعتكم المستمرة 🌟`;
          messageType = 'performance';
        } else if (hasAttendance) {
          // رسالة حضور بدون تقرير
          message = `✅ تأكيد حضور\n\nعزيزي ولي الأمر،\n\nنود إعلامكم بحضور الطالب/ة: ${student.name}\nفي حصة اليوم\n\n📚 تفاصيل الحصة:\n• المادة: ${session.subject_name || 'غير محدد'}\n• الفصل: ${session.class_name}\n• المعلم: ${session.teacher_name || 'غير محدد'}\n• التاريخ: ${sessionDate}\n• الوقت: ${sessionTime}${session.location_name ? `\n• المكان: ${session.location_name}` : ''}\n\n📚 نظام إدارة الحضور`;
          messageType = 'attendance';
        } else {
          console.log(`⏭️ تخطي الطالب ${student.name} - لا توجد بيانات كافية`);
          continue;
        }
        
        try {
          console.log(`📤 إرسال رسالة ${messageType} للطالب: ${student.name}`);
          const result = await this.sendMessage(student.parent_phone, message);
          
          // تسجيل الرسالة في قاعدة البيانات
          await executeQuery(
            'INSERT INTO whatsapp_logs (student_id, session_id, message_type, message, phone_number, status) VALUES (?, ?, ?, ?, ?, ?)',
            [student.id, sessionId, messageType, message, student.parent_phone, 'sent']
          );
          
          sentCount++;
          results.push({
            studentId: student.id,
            studentName: student.name,
            phoneNumber: student.parent_phone,
            success: true,
            messageId: result.messageId,
            messageType
          });
          
          console.log(`✅ تم إرسال الرسالة بنجاح للطالب: ${student.name}`);
          
        } catch (error) {
          console.error(`❌ خطأ في إرسال رسالة للطالب ${student.name}:`, error);
          
          // تسجيل الخطأ في قاعدة البيانات
          await executeQuery(
            'INSERT INTO whatsapp_logs (student_id, session_id, message_type, message, phone_number, status, error_message) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [student.id, sessionId, messageType, message, student.parent_phone, 'failed', error.message]
          );
          
          failedCount++;
          results.push({
            studentId: student.id,
            studentName: student.name,
            phoneNumber: student.parent_phone,
            success: false,
            error: error.message,
            messageType
          });
        }
      }
      
      console.log(`📊 ملخص الإرسال: ${sentCount} نجح، ${failedCount} فشل من أصل ${students.length} طالب`);
      
      return {
        success: true,
        totalStudents: students.length,
        sentMessages: sentCount,
        failedMessages: failedCount,
        results
      };
      
    } catch (error) {
      console.error('❌ خطأ في إرسال تقرير الجلسة:', error);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('رقم الهاتف مطلوب');
    }
    
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // التحقق من طول الرقم
    if (cleaned.length < 10) {
      throw new Error('رقم الهاتف قصير جداً');
    }
    
    // دعم الأرقام المصرية والسعودية
    if (cleaned.startsWith('20')) {
      // رقم مصري - التحقق من صحة الرقم
      if (!cleaned.match(/^20[0-9]{9,10}$/)) {
        throw new Error('رقم الهاتف المصري غير صحيح');
      }
    } else if (cleaned.startsWith('966')) {
      // رقم سعودي - التحقق من صحة الرقم
      if (!cleaned.match(/^966[5][0-9]{8}$/)) {
        throw new Error('رقم الهاتف السعودي غير صحيح');
      }
    } else {
      // محاولة تحديد نوع الرقم وإضافة الكود المناسب
      if (cleaned.startsWith('0')) {
        // إزالة الصفر الأول
        cleaned = cleaned.substring(1);
      }
      
      if (cleaned.startsWith('5') && cleaned.length === 9) {
        // رقم سعودي بدون كود الدولة
        cleaned = '966' + cleaned;
      } else if (cleaned.startsWith('1') && cleaned.length >= 9) {
        // رقم مصري بدون كود الدولة
        cleaned = '20' + cleaned;
      } else {
        // محاولة تخمين الرقم بناءً على الطول
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
          // رقم مصري محتمل
          cleaned = '20' + cleaned;
        } else if (cleaned.length === 9 && cleaned.startsWith('5')) {
          // رقم سعودي محتمل
          cleaned = '966' + cleaned;
        } else {
          console.warn('⚠️ تنسيق رقم غير معروف، سيتم المحاولة كما هو:', cleaned);
        }
      }
    }
    
    return cleaned + '@c.us';
  }

  async cleanup() {
    try {
      this.stopStatusCheck();
      
      if (this.client) {
        console.log('🧹 تنظيف الاتصال السابق...');
        try {
          await this.client.close();
        } catch (error) {
          console.log('⚠️ خطأ في إغلاق الاتصال السابق:', error.message);
        }
        this.client = null;
      }
      
      this.isConnected = false;
      this.isInitializing = false;
      this.connectionRetries = 0;
      this.qrCode = null;
      
    } catch (error) {
      console.error('❌ خطأ في تنظيف الاتصال:', error);
    }
  }

  async disconnect() {
    console.log('🔌 قطع اتصال الواتساب...');
    await this.cleanup();
    console.log('✅ تم قطع الاتصال بنجاح');
  }

  getConnectionStatus() {
    return this.isConnected && this.client !== null;
  }

  getQRCode() {
    return this.qrCode;
  }

  // دالة للتحقق من صحة الاتصال
  async validateConnection() {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const state = await this.client.getConnectionState();
      const isValid = state === 'CONNECTED';
      
      if (!isValid) {
        console.log('⚠️ الاتصال غير صالح:', state);
        this.handleDisconnection();
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ خطأ في التحقق من صحة الاتصال:', error);
      this.handleDisconnection();
      return false;
    }
  }
}

// إنشاء instance واحد
const whatsappService = new WhatsAppService();

// معالجة إغلاق التطبيق
process.on('SIGINT', async () => {
  console.log('\n🛑 إيقاف خدمة الواتساب...');
  await whatsappService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 إيقاف خدمة الواتساب...');
  await whatsappService.disconnect();
  process.exit(0);
});

module.exports = whatsappService;