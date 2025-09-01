// Configuration file for Keyword Highlighter extension
// Replace 'YOUR_OPENAI_API_KEY' with your actual OpenAI API key

const CONFIG = {
  // OpenAI API Configuration
  OPENAI_API_KEY: 'YOUR_OPENAI_API_KEY', // Get from https://platform.openai.com/api-keys
  
  // Job Detection Settings
  JOB_DETECTION_DELAY: 2000, // Delay before extracting job info (ms)
  MAX_CONTENT_LENGTH: 2000,  // Maximum characters to send to GPT API
  
  // API Endpoints
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
  
  // Job Keywords for Detection
  JOB_KEYWORDS: [
    'job', 'career', 'position', 'apply', 'hiring', 
    'employment', 'work', 'opportunity', 'vacancy',
    'opening', 'role', 'posting', 'recruitment'
  ]
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
