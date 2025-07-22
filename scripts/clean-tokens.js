const fs = require('fs-extra');
const path = require('path');

async function cleanTokens() {
  try {
    const tokensPath = './tokens';
    
    console.log('🧹 بدء تنظيف ملفات التوكن...');
    
    if (await fs.pathExists(tokensPath)) {
      // إنشاء نسخة احتياطية قبل الحذف
      const backupPath = `./tokens_backup_${Date.now()}`;
      console.log('💾 إنشاء نسخة احتياطية...');
      await fs.copy(tokensPath, backupPath);
      console.log(`✅ تم إنشاء نسخة احتياطية في: ${backupPath}`);
      
      // حذف مجلد التوكن
      await fs.remove(tokensPath);
      console.log('🗑️ تم حذف مجلد التوكن');
      
      // إعادة إنشاء مجلد فارغ
      await fs.ensureDir(tokensPath);
      console.log('📁 تم إنشاء مجلد توكن جديد');
      
      console.log('✅ تم تنظيف ملفات التوكن بنجاح!');
      console.log('💡 يمكنك الآن إعادة تهيئة الواتساب');
    } else {
      console.log('ℹ️ مجلد التوكن غير موجود');
    }
    
  } catch (error) {
    console.error('❌ خطأ في تنظيف التوكن:', error);
  }
}

if (require.main === module) {
  cleanTokens();
}

module.exports = cleanTokens;