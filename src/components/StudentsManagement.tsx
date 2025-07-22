import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Users, Plus, Edit, Trash2, Search, Eye } from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const { students, classes, attendance, addStudent, updateStudent, deleteStudent, generateStudentBarcode, hasPermission } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    parentPhone: '',
    classId: '' as string | null
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.barcode && student.barcode.includes(searchTerm));
    const matchesClass = selectedClass === '' || 
                        (selectedClass === 'no-class' && !student.classId) ||
                        student.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  // حساب البيانات للصفحة الحالية
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  // إعادة تعيين الصفحة عند تغيير الفلاتر
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الحقول الإلزامية
    if (!formData.name || !formData.parentPhone) {
      alert('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    // التحقق من طول رقم الهاتف (يجب أن يكون 12 رقم بالضبط)
    const phoneDigits = formData.parentPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 12) {
      alert('رقم هاتف ولي الأمر يجب أن يكون 12 رقم بالضبط (مثال: 201002246668 أو 966501234567)');
      return;
    }
    
    if (editingStudent) {
      updateStudent(editingStudent, {
        name: formData.name,
        parentPhone: phoneDigits,
        parentEmail: formData.parentEmail,
        classId: formData.classId
      });
      setEditingStudent(null);
    } else {
      addStudent({
        name: formData.name,
        barcode: formData.barcode || '',
        parentPhone: phoneDigits,
        parentEmail: formData.parentEmail,
        classId: formData.classId
      });
    }
    setFormData({ name: '', barcode: '', parentPhone: '', classId: '' });
    setShowAddForm(false);
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student.id);
    setFormData({
      name: student.name,
      barcode: student.barcode,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      classId: student.classId
    });
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    // التحقق من وجود سجلات حضور للطالب
    const studentAttendance = attendance.filter(a => a.studentId === id);
    if (studentAttendance.length > 0) {
      if (!window.confirm(`هذا الطالب لديه ${studentAttendance.length} سجل حضور. هل أنت متأكد من الحذف؟ سيتم حذف جميع سجلات الحضور أيضاً.`)) {
        return;
      }
    }
    
    if (window.confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
      deleteStudent(id);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', barcode: '', parentPhone: '', classId: '' });
    setEditingStudent(null);
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="h-6 w-6 ml-2" />
          إدارة الطلاب
        </h1>
        {hasPermission('studentsEdit') && (
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة طالب
        </button>
        )}
      </div>

      {/* نموذج الإضافة/التعديل */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingStudent ? 'تعديل الطالب' : 'إضافة طالب جديد'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الطالب *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {!editingStudent && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    سيتم توليد كود الطالب تلقائياً: {generateStudentBarcode()}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم هاتف ولي الأمر *
                </label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="201002246668 أو 966501234567"
                  maxLength={12}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  يجب إدخال 12 رقم بالضبط مع كود الدولة (مثال: 201002246668 أو 966501234567)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني لولي الأمر
                </label>
                <input
                  type="email"
                  value={formData.parentEmail || ''}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="parent@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفصل
                </label>
                <select
                  value={formData.classId || ''}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">بدون فصل</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4 space-x-reverse">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingStudent ? 'حفظ التغييرات' : 'إضافة الطالب'}
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

      {/* البحث والفلترة */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث عن طالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="md:w-64">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الفصول</option>
              <option value="no-class">بدون فصل</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* قائمة الطلاب */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الاسم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الكود
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الفصل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  رقم ولي الأمر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإضافة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStudents.map((student) => {
                const studentClass = classes.find(c => c.id === student.classId);
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.barcode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {studentClass?.name || (
                          <span className="text-red-500">بدون فصل</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.parentPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB') : 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => {/* عرض تفاصيل الطالب */}}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(student)}
                          disabled={!hasPermission('studentsEdit')}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          disabled={!hasPermission('studentsDelete')}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                  <span className="font-medium">{Math.min(endIndex, filteredStudents.length)}</span> من{' '}
                  <span className="font-medium">{filteredStudents.length}</span> نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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

      {currentStudents.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filteredStudents.length === 0 ? 'لا توجد طلاب مطابقين للبحث' : 'لا توجد بيانات في هذه الصفحة'}
          </p>
        </div>
      )}
    </div>
  );
};