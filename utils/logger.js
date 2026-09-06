const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  formatLog(level, message, data = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      env: process.env.NODE_ENV,
    });
  }

  writeToFile(filename, logMessage) {
    const filepath = path.join(this.logsDir, filename);
    fs.appendFileSync(filepath, logMessage + '\n');
  }

  info(message, data = {}) {
    const log = this.formatLog('INFO', message, data);
    console.log(log);
    if (process.env.NODE_ENV === 'production') {
      this.writeToFile('app.log', log);
    }
  }

  warn(message, data = {}) {
    const log = this.formatLog('WARN', message, data);
    console.warn(log);
    this.writeToFile('warn.log', log);
  }

  error(message, error = {}, data = {}) {
    const log = this.formatLog('ERROR', message, {
      error: {
        message: error.message,
        stack: error.stack,
      },
      ...data,
    });
    console.error(log);
    this.writeToFile('error.log', log);
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV !== 'production') {
      const log = this.formatLog('DEBUG', message, data);
      console.debug(log);
    }
  }

  security(message, data = {}) {
    const log = this.formatLog('SECURITY', message, data);
    console.log(log);
    this.writeToFile('security.log', log);
  }
}

module.exports = new Logger();
