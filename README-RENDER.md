# نظام إدارة الحضور الشامل

## النشر على Render

### Backend
- Service Type: Web Service
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node.js

### Frontend
- Service Type: Static Site
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

### متغيرات البيئة المطلوبة:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET
- SESSION_SECRET
- WHATSAPP_SESSION_NAME
- CHROME_PATH

## الاستخدام
1. تسجيل الدخول: admin / admin123
2. تهيئة الواتساب من قسم إدارة الواتساب
3. إضافة الطلاب والفصول
4. بدء استخدام النظام