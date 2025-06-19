import { OpenAILogger } from './logger';

// 브라우저 환경에서만 logger 초기화
if (typeof window !== 'undefined') {
  // Initialize logger with a startup message
  const startupMessage = `\n=== Application Started at ${new Date().toISOString()} ===\n\n`;
  const existingLogs = OpenAILogger.getLogs();
  OpenAILogger.clearLogs();
  OpenAILogger.log({
    timestamp: new Date().toISOString(),
    type: 'request',
    model: 'system',
    prompt: startupMessage
  });
}

// Export the initialized logger
export { OpenAILogger }; 