const path = require('path');

module.exports = {
  session: process.env.WHATSAPP_SESSION_NAME || 'attendance-system',

  folderNameToken: process.env.TOKENS_PATH || './tokens',
  mkdirFolderToken: '',

  headless: 'new',
  devtools: process.env.WHATSAPP_DEBUG === 'true',
  useChrome: true,
  debug: process.env.WHATSAPP_DEBUG === 'true',
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
      '--disable-default-apps'
    ],
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    defaultViewport: null,
    ignoreHTTPSErrors: true,
    slowMo: 0
  },

  autoClose: parseInt(process.env.WHATSAPP_AUTO_CLOSE) || 0,
  createPathFileToken: true,
  waitForLogin: true,

  disableSpins: process.env.WHATSAPP_DISABLE_SPINS === 'true',
  disableWelcome: process.env.WHATSAPP_DISABLE_WELCOME === 'true',

  timeout: parseInt(process.env.WHATSAPP_TIMEOUT) || 60000,

  messageSettings: {
    maxPerMinute: parseInt(process.env.MAX_MESSAGES_PER_MINUTE) || 15,
    delay: parseInt(process.env.MESSAGE_DELAY) || 2000,
    retryDelay: parseInt(process.env.WHATSAPP_RETRY_DELAY) || 3000
  }
};
