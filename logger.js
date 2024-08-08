const { createLogger, format, transports } = require('winston'); // Import necessary functions from the winston library
const { combine, timestamp, printf } = format; // Extract specific format functions for convenience
const path = require('path'); // Import path module for handling and transforming file paths
const fs = require('fs'); // Import file system module for interacting with the file system

// Ensure log directory exists
const logDir = path.join(__dirname, 'logs'); // Define the path to the log directory
if (!fs.existsSync(logDir)) { // Check if the log directory does not exist
    fs.mkdirSync(logDir); // Create the log directory
}

// Generate log filename with current date and time
const getLogFileName = (prefix) => {
    const now = new Date(); // Get the current date and time
    const date = now.toISOString().slice(0, 10); // Extract the date in YYYY-MM-DD format
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // Extract the time in HH-MM-SS format and replace colons with dashes
    return path.join(logDir, `${prefix}-${date}_${time}.log`); // Return the full path to the log file with the given prefix
};

// Store filenames for later use
const errorLogFile = getLogFileName('error'); // Generate filename for the error log
const combinedLogFile = getLogFileName('combined'); // Generate filename for the combined log

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`; // Define a custom format for log messages
});

// Create a logger with dynamic filenames
const logger = createLogger({
    level: process.env.DEBUG === 'true' ? 'debug' : 'info', // Set log level based on DEBUG environment variable
    format: combine(
        timestamp(), // Add timestamp to log messages
        printf(({ timestamp, level, message, stack }) => { // Define a custom format with timestamp, level, and message (or stack if available)
            return `${timestamp} [${level}]: ${stack || message}`;
        })
    ),
    transports: [
        new transports.File({
            filename: errorLogFile, // Log errors to the error log file
            level: 'error' // Only log error messages
        }),
        new transports.File({
            filename: combinedLogFile // Log all messages to the combined log file
        })
    ],
});

// Set file permissions to read-only after writing
function setLogFilesReadOnly() {
    fs.chmod(errorLogFile, 0o444, (err) => { // Set error log file to read-only
        if (err) { // Check for errors
            logger.error('Error setting error log to read-only:', err); // Log error if setting permissions fails
        } else {
            logger.info('Error log set to read-only'); // Log success message
        }
    });

    fs.chmod(combinedLogFile, 0o444, (err) => { // Set combined log file to read-only
        if (err) { // Check for errors
            logger.error('Error setting combined log to read-only:', err); // Log error if setting permissions fails
        } else {
            logger.info('Combined log set to read-only'); // Log success message
        }
    });
}

// Listen for process signals to detect server shutdown
process.on('SIGINT', () => { // Listen for SIGINT signal (e.g., Ctrl+C)
    logger.info('SIGINT received, setting log files to read-only...'); // Log the received signal
    setLogFilesReadOnly(); // Set log files to read-only
    process.exit(0); // Exit the process
});

process.on('SIGTERM', () => { // Listen for SIGTERM signal (e.g., kill command)
    logger.info('SIGTERM received, setting log files to read-only...'); // Log the received signal
    setLogFilesReadOnly(); // Set log files to read-only
    process.exit(0); // Exit the process
});

// If we're not in production, then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') { // Check if the environment is not production
    logger.add(new transports.Console({ // Add console transport to log to the console
        format: format.simple(), // Use simple format for console logs
    }));
}

module.exports = logger; // Export the logger for use in other parts of the application
