const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Generate log filename with current date and time
const getLogFileName = (prefix) => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD format
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS format
    return path.join(logDir, `${prefix}-${date}_${time}.log`);
};

// Store filenames for later use
const errorLogFile = getLogFileName('error');
const combinedLogFile = getLogFileName('combined');

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

// Create a logger with dynamic filenames
const logger = createLogger({
    level: process.env.DEBUG === 'true' ? 'debug' : 'info',
    format: combine(
        timestamp(),
        printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} [${level}]: ${stack || message}`;
        })
    ),
    transports: [
        new transports.File({
            filename: errorLogFile,
            level: 'error'
        }),
        new transports.File({
            filename: combinedLogFile
        })
    ],
});

// Set file permissions to read-only after writing
function setLogFilesReadOnly() {
    fs.chmod(errorLogFile, 0o444, (err) => {
        if (err) {
            logger.error('Error setting error log to read-only:', err);
        } else {
            logger.info('Error log set to read-only');
        }
    });

    fs.chmod(combinedLogFile, 0o444, (err) => {
        if (err) {
            logger.error('Error setting combined log to read-only:', err);
        } else {
            logger.info('Combined log set to read-only');
        }
    });
}

// Listen for process signals to detect server shutdown
process.on('SIGINT', () => {
    logger.info('SIGINT received, setting log files to read-only...');
    setLogFilesReadOnly();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received, setting log files to read-only...');
    setLogFilesReadOnly();
    process.exit(0);
});

// If we're not in production, then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.simple(),
    }));
}

module.exports = logger;
