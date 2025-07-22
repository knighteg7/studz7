import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { Calendar, Plus, Edit, Trash2, Search, Eye, Clock, Play, Square, CheckCircle, Star, MessageSquare, X, ToggleLeft, ToggleRight } from 'lucide-react';

export const SessionsManagement: React.FC = () => {
  const { sessions, classes, students, addSession, updateSession, deleteSession, toggleSessionStatus, attendance, addReport, reports, teachers, subjects, locations, getWhatsAppStatus, hasPermission, recordAttendance } = useApp();
  
  // إضافة تسجيل للتحقق من البيانات
  React.useEffect(() => {
    console.log('🔍 SessionsManagement - البيانات المتاحة:');
    console.log('- الجلسات:', sessions.length);
    console.log('- الفصول:', classes.length);
    console.log('- الطلاب:', students.length);
    console.log('- المعلمين:', teachers.length);
    console.log('- المواد:', subjects.length);
    console.log('- الأماكن:', locations.length);
    
    if (sessions.length > 0) {
      console.log('📋 عينة من الجلسات:', sessions.slice(0, 3));
    }
  }, [sessions, classes, students, teachers, subjects, locations]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [showSessionDetails, setShowSessionDetails] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<{ show: boolean, studentId: string, studentName: string, sessionId: string }>({ show: false, studentId: '', studentName: '', sessionId: '' });
  const [reportData, setReportData] = useState({
    teacherRating: 5,
    quizScore: 0,
    participation: 5,
    behavior: 'ممتاز',
    homework: 'completed' as 'completed' | 'incomplete',
    comments: ''
  });
  const [formData, setFormData] = useState({
    classId: '',
    startTime: '',
    endTime: '',
    status: 'scheduled' as 'scheduled' | 'active' | 'completed' | 'cancelled'
  });

  const connectionStatus = getWhatsAppStatus();

  const filteredSessions = sessions.filter(session => {
    const sessionClass = classes.find(c => c.id === session.classId);
    const matchesSearch = searchTerm === '' || sessionClass?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || session.status === statusFilter;
    
    console.log('🔍 فلترة الجلسة:', {
      sessionId: session.id,
      className: sessionClass?.name,
      searchTerm,
      statusFilter,
      matchesSearch,
      matchesStatus,
      finalResult: matchesSearch && matchesStatus
    });
    
    return matchesSearch && matchesStatus;
  });

  // حساب البيانات للصفحة الحالية
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = filteredSessions.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);
  // إضافة تسجيل للجلسات المفلترة
  React.useEffect(() => {
    console.log('📊 نتائج الفلترة:');
    console.log('- إجمالي الجلسات:', sessions.length);
    console.log('- الجلسات المفلترة:', filteredSessions.length);
    console.log('- مصطلح البحث:', searchTerm);
    console.log('- فلتر الحالة:', statusFilter);
  }, [sessions.length, filteredSessions.length, searchTerm, statusFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionData = {
      ...formData,
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime)
    };

    if (editingSession) {
      updateSession(editingSession, sessionData);
      setEditingSession(null);
    } else {
      addSession(sessionData);
    }
    setFormData({ classId: '', startTime: '', endTime: '', status: 'scheduled' });
    setShowAddForm(false);
  };

  const handleEdit = (session: any) => {
    setEditingSession(session.id);
    setFormData({
      classId: session.classId,
      startTime: new Date(session.startTime).toISOString().slice(0, 16),
      endTime: new Date(session.endTime).toISOString().slice(0, 16),
      status: session.status
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    const sessionAttendance = attendance.filter(a => a.sessionId === id);
    if (sessionAttendance.length > 0) {
      alert(`لا يمكن حذف الجلسة لأنها تحتوي على ${sessionAttendance.length} سجل حضور`);
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
      deleteSession(id);
    }
  };

  const resetForm = () => {
    setFormData({ classId: '', startTime: '', endTime: '', status: 'scheduled' });
    setEditingSession(null);
    setShowAddForm(false);
  };

  const handleAddReport = (studentId: string, studentName: string, sessionId: string) => {
    const existingReport = reports.find(r => r.studentId === studentId && r.sessionId === sessionId);
    if (existingReport) {
      setReportData({
        teacherRating: existingReport.teacherRating,
        quizScore: existingReport.quizScore || 0,
        participation: existingReport.participation,
        behavior: existingReport.behavior,
        homework: existingReport.homework,
        comments: existingReport.comments || ''
      });
    } else {
      setReportData({
        teacherRating: 5,
        quizScore: 0,
        participation: 5,
        behavior: 'ممتاز',
        homework: 'completed',
        comments: ''
      });
    }
    setShowReportModal({ show: true, studentId, studentName, sessionId });
  };

  const handleSubmitReport = () => {
    addReport({
      studentId: showReportModal.studentId,
      sessionId: showReportModal.sessionId,
      ...reportData
    });
    setShowReportModal({ show: false, studentId: '', studentName: '', sessionId: '' });
    setReportData({
      teacherRating: 5,
      quizScore: 0,
      participation: 5,
      behavior: 'ممتاز',
      homework: 'completed',
      comments: ''
    });
  };

  const handleSendSessionReport = async (sessionId: string) => {
    // التحقق من حالة الاتصال أولاً
    try {
      const statusResponse = await fetch(`${import.meta.env.VITE_API_URL}/whatsapp/status`);
      const statusResult = await statusResponse.json();
      
      if (!statusResult.success || !statusResult.data.connected) {
        alert('❌ الواتساب غير متصل. يرجى الذهاب إلى إدارة الواتساب وتهيئة الاتصال أولاً.');
        return;
      }
    } catch (error) {
      console.error('خطأ في فحص حالة الواتساب:', error);
      alert('يجب تهيئة الواتساب أولاً');
      return;
    }

    const session = sessions.find(s => s.id === sessionId);
    const sessionClass = classes.find(c => c.id === session?.classId);
    
    if (window.confirm(`هل أنت متأكد من إرسال تقرير جلسة "${sessionClass?.name || 'غير محدد'}" كاملاً؟\n\nسيتم إرسال رسائل الحضور والتقييمات لأولياء الأمور.\n\n⚠️ تأكد من أن الواتساب متصل قبل المتابعة.`)) {
      try {
        console.log('📤 إرسال تقرير الجلسة:', sessionId);
        
        // عرض رسالة تحميل
        const loadingAlert = alert('⏳ جاري إرسال التقرير... يرجى الانتظار وعدم إغلاق الصفحة.');
        
        // استدعاء API لإرسال التقرير
        const response = await fetch(`${import.meta.env.VITE_API_URL}/whatsapp/send-session-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId })
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(`✅ ${result.message}\n\nتفاصيل الإرسال:\n- تم الإرسال: ${result.data.sentMessages}\n- فشل الإرسال: ${result.data.failedMessages}\n- إجمالي الطلاب: ${result.data.totalStudents}`);
        } else {
          if (result.message.includes('غير متصل') || result.message.includes('غير مستقر')) {
            alert(`❌ ${result.message}\n\n💡 نصيحة: اذهب إلى إدارة الواتساب وأعد التهيئة، ثم حاول مرة أخرى.`);
          } else {
            alert(`❌ فشل في إرسال التقرير: ${result.message}`);
          }
        }
        
        setShowSessionDetails(null);
      } catch (error: any) {
        console.error('خطأ في إرسال التقرير:', error);
        
        if (error.message.includes('Failed to fetch')) {
          alert('❌ خطأ في الاتصال بالخادم. تأكد من تشغيل الخادم الخلفي.');
        } else {
          alert('❌ حدث خطأ أثناء إرسال التقرير: ' + error.message);
        }
      }
    }
  };

  const getSessionStudents = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return [];
    
    // جلب جميع طلاب الفصل
    const classStudents = students.filter(s => s.classId === session.classId);
    const sessionAttendance = attendance.filter(a => a.sessionId === sessionId);
    
    console.log('🔍 تحليل طلاب الجلسة:', {
      sessionId,
      classId: session.classId,
      totalClassStudents: classStudents.length,
      attendanceRecords: sessionAttendance.length
    });
    
    return classStudents.map(student => {
      const attendanceRecord = sessionAttendance.find(a => a.studentId === student.id);
      const studentReport = reports.find(r => r.studentId === student.id && r.sessionId === sessionId);
      
      const studentData = {
        ...student,
        attendanceStatus: attendanceRecord?.status || 'absent',
        hasReport: !!studentReport,
        attendanceId: attendanceRecord?.id
      };
      
      console.log(`👤 الطالب ${student.name}: ${studentData.attendanceStatus}`);
      
      return studentData;
    });
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />;
      case 'active': return <Play className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <Square className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'مجدولة';
      case 'active': return 'نشطة';
      case 'completed': return 'مكتملة';
      case 'cancelled': return 'ملغاة';
      default: return status;
    }
  };

  const getSessionDisplayName = (session: any) => {
    const sessionClass = classes.find(c => c.id === session.classId);
    const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
    const subject = subjects.find(s => s.id === teacher?.subjectId);
    
    const teacherName = teacher?.name || 'غير محدد';
    const className = sessionClass?.name || 'غير محدد';
    
    let time = 'وقت غير صحيح';
    let date = 'تاريخ غير صحيح';
    
    try {
      const startTime = new Date(session.startTime);
      if (!isNaN(startTime.getTime())) {
        time = startTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
        date = startTime.toLocaleDateString('en-GB');
      }
    } catch (error) {
      console.error('خطأ في تحويل التاريخ:', error);
    }
    
    return `${teacherName} - ${className} - ${time} - ${date}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 ml-2" />
          إدارة الجلسات
        </h1>
        {hasPermission('sessionsEdit') && (
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة جلسة
        </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingSession ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفصل
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">اختر الفصل</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مكان الحصة
                </label>
                <select
                  value={formData.locationId || ''}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">اختر المكان</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} {location.roomNumber && `- ${location.roomNumber}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وقت البداية
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  وقت النهاية
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="scheduled">مجدولة</option>
                  <option value="active">نشطة</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingSession ? 'حفظ التغييرات' : 'إضافة الجلسة'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الجلسة */}
      {showSessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            {(() => {
              const session = sessions.find(s => s.id === showSessionDetails);
              const sessionClass = classes.find(c => c.id === session?.classId);
              const sessionStudents = getSessionStudents(showSessionDetails);
              const presentStudents = sessionStudents.filter(s => s.attendanceStatus === 'present');
              const absentStudents = sessionStudents.filter(s => s.attendanceStatus === 'absent');
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">تفاصيل جلسة {sessionClass?.name}</h2>
                    <button
                      onClick={() => setShowSessionDetails(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900">وقت الجلسة</h3>
                      <p className="text-blue-700">
                        {session?.startTime ? new Date(session.startTime).toLocaleString('en-GB', {
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false
                        }) : ''}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900">الحضور</h3>
                      <p className="text-green-700">{presentStudents.length}/{sessionStudents.length}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-medium text-purple-900">التقارير المكتملة</h3>
                      <p className="text-purple-700">
                        {sessionStudents.filter(s => s.hasReport).length}/{presentStudents.length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">إجراءات الجلسة</h3>
                    <button
                      onClick={() => handleSendSessionReport(showSessionDetails)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center"
                    >
                      <MessageSquare className="h-4 w-4 ml-2" />
                      إرسال تقرير الجلسة كاملاً
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* الطلاب الحاضرون */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-green-600">الطلاب الحاضرون ({presentStudents.length})</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {presentStudents.map((student) => (
                          <div key={student.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                {student.hasReport && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    تم التقييم
                                  </span>
                                )}
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'absent'
                                  })}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  تسجيل غياب
                                </button>
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'late'
                                  })}
                                  className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                                >
                                  تأخير
                                </button>
                                <button
                                  onClick={() => handleAddReport(student.id, student.name, showSessionDetails)}
                                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
                                >
                                  <Star className="h-3 w-3 ml-1" />
                                  {student.hasReport ? 'تعديل التقييم' : 'إضافة تقييم'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {presentStudents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>لا يوجد طلاب حاضرون</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* الطلاب الغائبون */}
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-red-600">الطلاب الغائبون ({absentStudents.length})</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {absentStudents.map((student) => (
                          <div key={student.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                                <p className="text-xs text-red-600">غائب</p>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'present'
                                  })}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  تسجيل حضور
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {absentStudents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p>جميع الطلاب حاضرون! 🎉</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* إضافة قسم الطلاب المتأخرين والمعذورين */}
                  {sessionStudents.filter(s => s.attendanceStatus === 'late' || s.attendanceStatus === 'excused').length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4 text-yellow-600">
                        الطلاب المتأخرون والمعذورون ({sessionStudents.filter(s => s.attendanceStatus === 'late' || s.attendanceStatus === 'excused').length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {sessionStudents.filter(s => s.attendanceStatus === 'late' || s.attendanceStatus === 'excused').map((student) => (
                          <div key={student.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">كود: {student.barcode}</p>
                                <p className="text-xs text-yellow-600">
                                  {student.attendanceStatus === 'late' ? 'متأخر' : 'معذور'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'present'
                                  })}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  تحويل لحاضر
                                </button>
                                <button
                                  onClick={() => recordAttendance({
                                    studentId: student.id,
                                    sessionId: showSessionDetails,
                                    status: 'absent'
                                  })}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                  تحويل لغائب
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* نافذة إضافة التقييم */}
      {showReportModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">تقييم الطالب: {showReportModal.studentName}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تقييم المعلم (1-5)
                </label>
                <select
                  value={reportData.teacherRating}
                  onChange={(e) => setReportData({ ...reportData, teacherRating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>ممتاز (5)</option>
                  <option value={4}>جيد جداً (4)</option>
                  <option value={3}>جيد (3)</option>
                  <option value={2}>مقبول (2)</option>
                  <option value={1}>ضعيف (1)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  درجة الكويز (اختياري)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={reportData.quizScore}
                  onChange={(e) => setReportData({ ...reportData, quizScore: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="من 100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المشاركة (1-5)
                </label>
                <select
                  value={reportData.participation}
                  onChange={(e) => setReportData({ ...reportData, participation: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>ممتاز (5)</option>
                  <option value={4}>جيد جداً (4)</option>
                  <option value={3}>جيد (3)</option>
                  <option value={2}>مقبول (2)</option>
                  <option value={1}>ضعيف (1)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  السلوك
                </label>
                <select
                  value={reportData.behavior}
                  onChange={(e) => setReportData({ ...reportData, behavior: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ممتاز">ممتاز</option>
                  <option value="جيد">جيد</option>
                  <option value="مقبول">مقبول</option>
                  <option value="يحتاج تحسين">يحتاج تحسين</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الواجب
                </label>
                <select
                  value={reportData.homework}
                  onChange={(e) => setReportData({ ...reportData, homework: e.target.value as 'completed' | 'incomplete' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="completed">مكتمل</option>
                  <option value="incomplete">غير مكتمل</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تعليقات إضافية
                </label>
                <textarea
                  value={reportData.comments}
                  onChange={(e) => setReportData({ ...reportData, comments: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>
              
              <div className="flex space-x-4 space-x-reverse">
                <button
                  onClick={handleSubmitReport}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  حفظ التقييم
                </button>
                <button
                  onClick={() => setShowReportModal({ show: false, studentId: '', studentName: '', sessionId: '' })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* البحث والفلترة */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن جلسة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الحالات</option>
              <option value="scheduled">مجدولة</option>
              <option value="active">نشطة</option>
              <option value="completed">مكتملة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>
      </div>

      {/* قائمة الجلسات */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفصل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت البداية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  وقت النهاية
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحضور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentSessions.map((session) => {
                const sessionClass = classes.find(c => c.id === session.classId);
                const sessionAttendance = attendance.filter(a => a.sessionId === session.id);
                const presentCount = sessionAttendance.filter(a => a.status === 'present').length;
                
                return (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sessionClass?.name || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          try {
                            const startTime = new Date(session.startTime);
                            if (!isNaN(startTime.getTime())) {
                              return startTime.toLocaleString('en-GB', {
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              });
                            }
                            return 'تاريخ غير صحيح';
                          } catch (error) {
                            return 'تاريخ غير صحيح';
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          try {
                            const endTime = new Date(session.endTime);
                            if (!isNaN(endTime.getTime())) {
                              return endTime.toLocaleString('en-GB', {
                                year: 'numeric', 
                                month: '2-digit', 
                                day: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              });
                            }
                            return 'تاريخ غير صحيح';
                          } catch (error) {
                            return 'تاريخ غير صحيح';
                          }
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)}
                        <span className="mr-1">{getStatusText(session.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {presentCount}/{sessionAttendance.length}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        {hasPermission('sessionsEdit') && (
                        <button
                          onClick={() => toggleSessionStatus(session.id)}
                          className="p-1 rounded text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 transition-colors"
                          title={session.status === 'active' ? 'تحويل إلى مكتملة' : 'تحويل إلى نشطة'}
                        >
                          {session.status === 'active' ? (
                            <Square className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                        )}
                        <button
                          onClick={() => setShowSessionDetails(session.id)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {hasPermission('sessionsEdit') && (
                        <button
                          onClick={() => handleEdit(session)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        )}
                        {hasPermission('sessionsDelete') && (
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="mr-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{startIndex + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredSessions.length)}</span> من{' '}
                  <span className="font-medium">{filteredSessions.length}</span> نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filteredSessions.length === 0 ? 'لا توجد جلسات مطابقة للبحث' : 'لا توجد بيانات في هذه الصفحة'}
          </p>
        </div>
      )}
    </div>
  );
};
