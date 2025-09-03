// Initialize variables
let keywords = [];
let matches = {};
let observer = null;
let isProcessing = false;
let processedElements = new WeakSet();
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// Job information extraction
let jobInfo = null;
let isJobSite = false;
let aiProvider = 'openai';
let openaiKeys = [];
let geminiKeys = [];
let selectedOpenaiKey = null;
let selectedGeminiKey = null;
let loadAttempts = 0;
let maxLoadAttempts = 3;
let loadFailed = false;
let lastLoadError = null;
let isRequestInProgress = false; // Prevent multiple simultaneous requests
let blockedRequests = 0; // Track blocked requests
let jobRadarEnabled = true; // Default to enabled
let coverLetterEnabled = false; // Default to disabled
let userLocation = null;
let userWorkExperience = null;

  // Helper function to remove unnecessary elements from HTML content
  function cleanHtmlContent(htmlContent) {
    if (!htmlContent || typeof htmlContent !== 'string') return htmlContent;
    
    let cleaned = htmlContent;
    
    // Remove script and style elements
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/<link[^>]*>/gi, '');
    cleaned = cleaned.replace(/<meta[^>]*>/gi, '');
    
    // Remove comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, '');
    
    // Remove SVG elements
    cleaned = cleaned.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
    
    // Remove images
    cleaned = cleaned.replace(/<img[^>]*>/gi, '');
    
    // Remove video/audio
    cleaned = cleaned.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '');
    cleaned = cleaned.replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, '');
    
    // Remove iframes
    cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
    
    // Remove navigation and footer
    cleaned = cleaned.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
    cleaned = cleaned.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
    
    // Remove forms
    // cleaned = cleaned.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');
    // cleaned = cleaned.replace(/<input[^>]*>/gi, '');
    cleaned = cleaned.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');
    
    // Remove extension's own UI elements
    cleaned = cleaned.replace(/<div[^>]*id="[^"]*keyword-highlighter-badge[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*badge[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*job-info[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*button-row[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*status-grid[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*status-item[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*loading-ui[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*loading-progress[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*keyword-result[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*keyword-info[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*count-badge[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<button[^>]*class="[^"]*(?:copy-job-btn|extract-job-btn)[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '');
    
    // Remove any text content that might be from the badge UI
    cleaned = cleaned.replace(/Company:\s*[^<]*<br>/gi, '');
    cleaned = cleaned.replace(/Position:\s*[^<]*<br>/gi, '');
    cleaned = cleaned.replace(/Job Information[^<]*/gi, '');
    cleaned = cleaned.replace(/Job Detection Status[^<]*/gi, '');
    cleaned = cleaned.replace(/Site:[^<]*/gi, '');
    cleaned = cleaned.replace(/API Key:[^<]*/gi, '');
    cleaned = cleaned.replace(/Job Info:[^<]*/gi, '');
    cleaned = cleaned.replace(/matches found[^<]*/gi, '');
    cleaned = cleaned.replace(/Total Keywords:[^<]*/gi, '');
    
    // Remove more specific badge UI patterns
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*badge-content[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*badge-drag-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*drag-icon[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*job-info-title[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*job-type-[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<span[^>]*class="[^"]*status-icon[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
    cleaned = cleaned.replace(/<span[^>]*class="[^"]*status-label[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
    cleaned = cleaned.replace(/<span[^>]*class="[^"]*status-value[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*loading-dots[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*progress-bar[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*progress-fill[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    cleaned = cleaned.replace(/<div[^>]*class="[^"]*progress-text[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    
    // Remove any remaining badge-related text
    cleaned = cleaned.replace(/Page Loading[^<]*/gi, '');
    cleaned = cleaned.replace(/elapsed[^<]*/gi, '');
    cleaned = cleaned.replace(/Extraction Failed[^<]*/gi, '');
    cleaned = cleaned.replace(/Click to retry[^<]*/gi, '');
    cleaned = cleaned.replace(/Extracting[^<]*/gi, '');
    cleaned = cleaned.replace(/Available[^<]*/gi, '');
    cleaned = cleaned.replace(/Job Site[^<]*/gi, '');
    cleaned = cleaned.replace(/Not Job Site[^<]*/gi, '');
    cleaned = cleaned.replace(/Missing[^<]*/gi, '');
    cleaned = cleaned.replace(/Extracted[^<]*/gi, '');
        
    // Remove style attributes
    cleaned = cleaned.replace(/\s*style="[^"]*"/gi, '');
    
    // Remove empty elements
    cleaned = cleaned.replace(/<[^>]*>\s*<\/[^>]*>/gi, '');
    
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
  }

// Helper function to get color for company size
function getCompanySizeColor(companySize) {
  if (!companySize) return '#6b7280'; // gray for unknown
  
  const size = companySize.toLowerCase();
  switch (size) {
    case 'startup':
      return '#f59e0b'; // orange for startup
    case 'scale-up':
      return '#3b82f6'; // blue for scale-up
    case 'mid-size':
      return '#059669'; // green for mid-size
    case 'enterprise':
      return '#7c3aed'; // purple for enterprise
    default:
      return '#6b7280'; // gray for unknown
  }
  }

// Default keywords with individual colors
const defaultKeywords = [
  { text: 'remote', color: 'green' },
  { text: 'start-up', color: 'orange' },
  { text: 'startup', color: 'orange' },
  { text: 'on-site', color: 'red' },
  { text: 'onsite', color: 'red' },
  { text: 'hybrid', color: 'yellow' },
  { text: 'In-office', color: 'purple' },
  { text: 'in office', color: 'purple' },
  { text: 'relocate', color: 'red' }
];

// Load settings from storage including badge position
chrome.storage.sync.get(['keywords', 'badgePosition', 'aiProvider', 'openaiKeys', 'geminiKeys', 'selectedOpenaiKey', 'selectedGeminiKey', 'openaiApiKey', 'userLocation', 'workExperience', 'coverLetterEnabled'], (result) => {

  if (result.keywords && result.keywords.length > 0) {
    keywords = result.keywords;
  } else {
    // Set default keywords if none exist
    keywords = defaultKeywords;
    chrome.storage.sync.set({ keywords: defaultKeywords });
  }

  // Load AI settings
  aiProvider = result.aiProvider || 'openai';
  openaiKeys = result.openaiKeys || [];
  geminiKeys = result.geminiKeys || [];
  selectedOpenaiKey = result.selectedOpenaiKey || null;
  selectedGeminiKey = result.selectedGeminiKey || null;
  
  // Migration: Handle old single API key format
  if (result.openaiApiKey && openaiKeys.length === 0) {
    // The popup will handle the migration, just use the old key temporarily
    console.log('Using old OpenAI API key temporarily until migration completes...');
    const keyId = 'migrated_' + Date.now().toString();
    const keyData = {
      id: keyId,
      key: result.openaiApiKey,
      masked: result.openaiApiKey.substring(0, 12) + '••••••••••••••••••••',
      status: 'unknown',
      addedAt: new Date().toISOString(),
      usage: {
        requestsToday: 0,
        tokensToday: 0,
        lastReset: new Date().toDateString(),
        rateLimitReset: null,
        isRateLimited: false
      }
    };
    openaiKeys.push(keyData);
    selectedOpenaiKey = keyId;
  }
  
  // Load user profile data
  if (result.userLocation) {
    userLocation = result.userLocation;
  }
  
  if (result.workExperience) {
    userWorkExperience = result.workExperience;
  }
  
  // Load cover letter toggle state (default to disabled)
  coverLetterEnabled = result.coverLetterEnabled === true;

  initializeHighlighter();

  // Initialize badge position after a short delay to ensure badge is created
  setTimeout(() => {
    if (result.badgePosition) {
      initializeBadgePosition(result.badgePosition);
    }
  }, 100);
});

// Listen for updates
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.keywords) {
      keywords = changes.keywords.newValue || [];
      removeHighlights();
      processedElements = new WeakSet();
      initializeHighlighter();
    }
    
    // Listen for AI settings changes
    if (changes.aiProvider) {
      aiProvider = changes.aiProvider.newValue || 'openai';
    }
    if (changes.openaiKeys) {
      openaiKeys = changes.openaiKeys.newValue || [];
    }
    if (changes.geminiKeys) {
      geminiKeys = changes.geminiKeys.newValue || [];
    }
    if (changes.selectedOpenaiKey) {
      selectedOpenaiKey = changes.selectedOpenaiKey.newValue || null;
    }
    if (changes.selectedGeminiKey) {
      selectedGeminiKey = changes.selectedGeminiKey.newValue || null;
    }
    
    // Listen for profile changes to update cover letter section in real-time
    if (changes.userWorkExperience || changes.userLocation) {
      if (changes.userWorkExperience) {
        userWorkExperience = changes.userWorkExperience.newValue;
      }
      if (changes.userLocation) {
        userLocation = changes.userLocation.newValue;
      }
      
      // Update badge UI to show/hide cover letter section with debounce
      clearTimeout(window.profileUpdateTimeout);
      window.profileUpdateTimeout = setTimeout(() => {
        updateBadgeForProfile();
      }, 3000);
    }
    
    // Listen for cover letter toggle changes
    if (changes.coverLetterEnabled) {
      coverLetterEnabled = changes.coverLetterEnabled.newValue === true;
      updateCoverLetterSectionVisibility();
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMatchCount') {
    // Calculate total matches from current DOM
    let totalMatches = 0;
    document.querySelectorAll('.keyword-highlight').forEach(highlight => {
      if (!isInsideBadge(highlight)) {
        totalMatches++;
      }
    });
    sendResponse({ totalMatches: totalMatches });
    
  } else if (request.action === 'updateJobRadarState') {
    jobRadarEnabled = request.enabled;
    
    if (jobRadarEnabled) {
      // Enable Job Radar - ensure badge exists and is visible
      let existing = document.getElementById('keyword-highlighter-badge');
      if (!existing) {
        existing = createBadge();
      }
      if (existing) {
        existing.style.display = 'block';
      }
    } else {
      // Disable Job Radar - hide badge immediately
      const existing = document.getElementById('keyword-highlighter-badge');
      if (existing) {
        existing.style.display = 'none';
      }
    }
    
  } else if (request.action === 'updateCoverLetterState') {
    coverLetterEnabled = request.enabled;
    
    // Update cover letter section visibility immediately
    updateCoverLetterSectionVisibility();
  } else if (request.action === 'updateKeywordColor') {
    // Update keyword color in existing highlights
    const keyword = request.keyword;
    const newColor = request.newColor;
    
    // Find all highlights for this keyword and update their colors
    document.querySelectorAll('.keyword-highlight').forEach(highlight => {
      if (highlight.textContent.toLowerCase().includes(keyword.toLowerCase())) {
        highlight.style.backgroundColor = newColor;
        highlight.style.color = getContrastColor(newColor);
      }
    });
  } else if (request.action === 'profileUpdated') {
    // Profile was updated from popup - update local variables and badge
    if (request.workExperience !== undefined) {
      userWorkExperience = request.workExperience;
    }
    if (request.userLocation !== undefined) {
      userLocation = request.userLocation;
    }
    
    // Update badge UI immediately to show/hide cover letter section
    updateBadgeForProfile();
  }
  return true;
});

// Get page load status for display
function getPageLoadStatus() {
  if (loadFailed) {
      return `❌ Extraction Failed (${lastLoadError || 'Unknown error'}) - Click 🔄 to retry`;
  } else if (loadAttempts >= 8) {
      return `⚠️ Max Attempts Reached (${loadAttempts}/8) - 30s elapsed - Click 🔄 to retry`;
  } else if (loadAttempts > 0) {
    const elapsedSeconds = Math.floor(loadAttempts * 4);
    return `🔄 Page Loading... (${loadAttempts}/8) - ${elapsedSeconds}s elapsed`;
  } else {
    return '✅ Page Ready';
  }
}

// Reset load status for new page
function resetLoadStatus() {
  loadAttempts = 0;
  loadFailed = false;
  lastLoadError = null;
}

// Retry job extraction
function retryJobExtraction() {
  resetLoadStatus();
  startContinuousJobExtraction(); // Start continuous monitoring again
}

// Manual job info extraction
function manualExtractJobInfo() {
  // Check if we have a valid API key for the current provider
  let hasValidApiKey = false;
  if (aiProvider === 'openai' && selectedOpenaiKey) {
    const key = openaiKeys.find(k => k.id === selectedOpenaiKey);
    hasValidApiKey = key && key.status === 'valid';
  } else if (aiProvider === 'gemini' && selectedGeminiKey) {
    const key = geminiKeys.find(k => k.id === selectedGeminiKey);
    hasValidApiKey = key && key.status === 'valid';
  }
  
  if (!hasValidApiKey) {
    alert(`Please configure your ${aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key in the AI Settings tab first.`);
    return;
  }
    
    // Clear any existing intervals to prevent conflicts
    if (window.extractionInterval) {
      clearInterval(window.extractionInterval);
      window.extractionInterval = null;
    }
  
  // Reset load status and start fresh extraction
  resetLoadStatus();
  loadAttempts = 1;
  
  // Show immediate feedback
  
  // Update badge to show extraction in progress
  updateBadge();
  
  // Start extraction immediately
  extractJobInfo();
  
  // Show user feedback
  const extractBtn = document.querySelector('.extract-job-btn');
  if (extractBtn) {
    extractBtn.textContent = '⏳';
    extractBtn.title = 'Extracting...';
    extractBtn.disabled = true;
    
    // Re-enable button after extraction completes
    setTimeout(() => {
      if (extractBtn) {
        extractBtn.textContent = '🔍';
        extractBtn.title = 'Extract Job Information';
        extractBtn.disabled = false;
      }
    }, 5000);
  }
}

// Update progress during extraction with smooth animations
function updateExtractionProgress() {
  if (loadAttempts > 0 && !loadFailed) {
    // Update badge with smooth progress animation
    updateBadge();
    
    // Add smooth progress bar animation
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      const progress = Math.min((loadAttempts / maxLoadAttempts) * 100, 100);
      progressFill.style.width = `${progress}%`;
      
      // Add pulse effect for active extraction
      if (loadAttempts < maxLoadAttempts) {
        progressFill.style.animation = 'progressPulse 2s ease-in-out infinite';
      } else {
        progressFill.style.animation = 'none';
      }
    }
  }
}

// Start continuous job extraction with smart delay system
function startContinuousJobExtraction() {
  console.log(`🚀 Starting continuous job extraction at ${new Date().toLocaleTimeString()}`);
  
  let attempts = 0;
  // Adjust interval based on provider to respect rate limits
  const interval = aiProvider === 'gemini' ? 6000 : 4000; // 6 seconds for Gemini (RPM limit), 4 seconds for OpenAI
  const maxAttempts = aiProvider === 'gemini' ? 5 : 8; // Fewer attempts for Gemini due to longer interval
    
    // Clear any existing interval to prevent multiple intervals
    if (window.extractionInterval) {
      console.log('🔄 Clearing existing extraction interval');
      clearInterval(window.extractionInterval);
    }
  
  // Calculate smart delay for multiple job pages
  const smartDelay = calculateSmartDelay();
  console.log(`⏰ Smart delay calculated: ${smartDelay}ms`);
  
  // Function to run extraction attempt
  const runExtractionAttempt = () => {
    attempts++;
    
    // Update badge to show progress
    loadAttempts = attempts;
    updateBadge();
    
    // Try to extract job info
    extractJobInfo().then(() => {
      // If successful, stop the interval
      if (jobInfo && jobInfo.position) {
        clearInterval(extractionInterval);
        loadFailed = false;
        lastLoadError = null;
        updateBadge();
      }
    }).catch((error) => {
    });
    
    // Stop after max attempts or if we have job info
    if (attempts >= maxAttempts || (jobInfo && jobInfo.position)) {
      clearInterval(extractionInterval);
      
      if (!jobInfo || !jobInfo.position) {
        loadFailed = true;
        lastLoadError = 'All attempts failed after 30 seconds';
      }
      
      updateBadge();
    }
  };
  
  // Start with smart delay instead of immediate attempt
  setTimeout(() => {
    runExtractionAttempt();
    
    // Then continue with interval-based attempts
    const extractionInterval = setInterval(runExtractionAttempt, interval);
    
    // Store the interval reference globally to prevent multiple intervals
    window.extractionInterval = extractionInterval;
  }, smartDelay);
}

// Calculate smart delay based on number of keys and estimated job pages
function calculateSmartDelay() {
  if (aiProvider !== 'gemini') {
    // For OpenAI, use minimal delay (2 seconds)
    return 2000;
  }
  
  const geminiKeyCount = geminiKeys.filter(key => key.status === 'valid').length;
  
  if (geminiKeyCount <= 1) {
    // Single key, use standard delay
    return 3000;
  }
  
  // Estimate number of job pages user might open
  // Assume user might open 10-60 job pages
  const estimatedJobPages = 30; // Conservative estimate
  
  // Calculate delay: 60 seconds / estimated pages / number of keys
  // This ensures keys are distributed across time
  const totalDelaySeconds = 60;
  const delayPerPage = (totalDelaySeconds * 1000) / estimatedJobPages;
  const delayPerKey = delayPerPage / geminiKeyCount;
  
  // Add some randomization to prevent all pages from syncing
  const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5
  const finalDelay = Math.max(1000, delayPerKey * randomFactor); // Minimum 1 second
  
  console.log(`📊 Smart delay calculation: ${geminiKeyCount} keys, ~${estimatedJobPages} pages, ${finalDelay.toFixed(0)}ms delay`);
  
  return Math.round(finalDelay);
}

// Start continuous keyword monitoring every 2 seconds for up to 30 seconds
function startContinuousKeywordMonitoring() {
  
  let attempts = 0;
  const maxAttempts = 15; // 30 seconds / 2 seconds = 15 attempts
  const interval = 2000; // 2 seconds
  
  const keywordInterval = setInterval(() => {
    attempts++;
    
    // Check if we have keywords to highlight
    if (keywords.length > 0) {
      // Try to highlight keywords
      highlightKeywords();
      
      // Check if we found any matches
      const currentMatches = countKeywordMatches();
      
      if (currentMatches > 0) {
        clearInterval(keywordInterval);
        updateBadge(); // Update badge with keyword matches
      }
    } else {
    }
    
    // Stop after max attempts or if we found matches
    if (attempts >= maxAttempts) {
      clearInterval(keywordInterval);
      
      // Final keyword count update
      const finalMatches = countKeywordMatches();
      updateBadge();
    }
  }, interval);
  
  // Also try immediate highlighting
  setTimeout(() => {
    if (keywords.length > 0) {
      highlightKeywords();
      const matches = countKeywordMatches();
    } else {
    }
  }, 500);
}

// Check if current page is a job site
function detectJobSite() {
  const url = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  const pageText = document.body.innerText.toLowerCase();
  
  // First, check for obvious non-job sites to avoid false positives
  const nonJobSites = [
    'google.com', 'gmail.com', 'drive.google.com', 'docs.google.com', 'sheets.google.com',
    'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'reddit.com',
    'amazon.com', 'ebay.com', 'wikipedia.org', 'stackoverflow.com', 'github.com',
    'netflix.com', 'spotify.com', 'discord.com', 'slack.com', 'zoom.us',
    'outlook.com', 'office.com', 'onedrive.com', 'teams.microsoft.com'
  ];
  
  // If it's a known non-job site, return false immediately
  if (nonJobSites.some(site => hostname.includes(site))) {
    return false;
  }
  
  // Job-related keywords for detection
  const jobKeywords = [
    'job', 'career', 'position', 'apply', 'hiring', 
    'employment', 'work', 'opportunity', 'vacancy',
    'opening', 'role', 'posting', 'recruitment',
    'engineer', 'developer', 'software', 'full stack',
    'remote', 'hybrid', 'onsite', 'full time', 'part time'
  ];
  
  // Check URL and page content for job-related keywords
  const urlMatch = jobKeywords.some(keyword => url.includes(keyword));
  const contentMatch = jobKeywords.some(keyword => pageText.includes(keyword));
  
  // Also check for common job site domains
  const jobDomains = [
    'linkedin.com/jobs', 'indeed.com', 'glassdoor.com',
    'jobs.lever.co', 'jobs.ashbyhq.com', 'greenhouse.io',
    'workday.com', 'bamboohr.com', 'smartrecruiters.com',
    'simplyhired.com'
  ];
  
  const domainMatch = jobDomains.some(domain => url.includes(domain));
  
  // Special check for SimplyHired
  const isSimplyHired = hostname.includes('simplyhired');
  const hasFlexContainer = isSimplyHired && document.querySelector('.flex-container') !== null;
  
  const isJobSite = urlMatch || contentMatch || domainMatch || (isSimplyHired && hasFlexContainer);
  

  
  return isJobSite;
}

// Extract job information using AI
async function getAvailableApiKey() {
  const keys = aiProvider === 'openai' ? openaiKeys : geminiKeys;
  
  if (aiProvider === 'openai') {
    // For OpenAI: Use the selected key (no auto-rotation needed)
    const selectedKey = keys.find(key => key.id === selectedOpenaiKey);
    
    if (selectedKey && selectedKey.status === 'valid') {
      console.log(`Using selected OpenAI key: ${selectedKey.masked}`);
      return selectedKey;
    }
    
    // If selected key is not valid, try to find any valid key
    const availableKeys = keys.filter(key => key.status === 'valid');
    if (availableKeys.length > 0) {
      console.log(`Selected key invalid, using first available OpenAI key: ${availableKeys[0].masked}`);
      return availableKeys[0];
    }
    
    return null;
  } else {
    // For Gemini: Smart key distribution based on page URL
    const availableKeys = keys.filter(key => 
      key.status === 'valid' && 
      !key.usage?.isRateLimited &&
      (key.usage?.requestsToday || 0) < 250 && (key.usage?.tokensToday || 0) < 250000
    );
    
    if (availableKeys.length === 0) {
      return null;
    }
    
    // Use page-based key distribution for multiple job pages
    const assignedKey = getPageAssignedKey(availableKeys);
    
    if (assignedKey) {
      console.log(`🎯 Using page-assigned Gemini key: ${assignedKey.masked} (${assignedKey.usage?.requestsToday || 0}/250 requests today)`);
      return assignedKey;
    }
    
    // Fallback to least usage if no page assignment
    const keyWithLeastUsage = availableKeys.reduce((least, current) => {
      const leastUsage = least.usage?.requestsToday || 0;
      const currentUsage = current.usage?.requestsToday || 0;
      return currentUsage < leastUsage ? current : least;
    });
    
    console.log(`🔄 Fallback to Gemini key with least usage: ${keyWithLeastUsage.masked} (${keyWithLeastUsage.usage?.requestsToday || 0}/250 requests today)`);
    return keyWithLeastUsage;
  }
}

// Assign specific keys to specific pages for load distribution
function getPageAssignedKey(availableKeys) {
  if (availableKeys.length <= 1) {
    return availableKeys[0];
  }
  
  // Use URL hash to consistently assign the same key to the same page
  const currentUrl = window.location.href;
  const urlHash = hashString(currentUrl);
  
  // Convert hash to index (0 to availableKeys.length-1)
  const keyIndex = urlHash % availableKeys.length;
  const assignedKey = availableKeys[keyIndex];
  
  console.log(`🔑 Page assignment: URL hash ${urlHash} → Key index ${keyIndex} → ${assignedKey.masked}`);
  
  return assignedKey;
}

// Simple hash function for URL-based key assignment
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// URL opening timing control system
let urlOpeningTracker = {
  lastUrlOpenTime: 0,
  urlOpenCount: 0,
  suggestedDelay: 0,
  isTracking: false,
  isDelaying: false,
  pendingDelays: []
};

// Initialize URL opening tracking
function initializeUrlOpeningTracker() {
  // Listen for page load events to track URL openings
  window.addEventListener('load', () => {
    trackUrlOpening();
  });
  
  // Also track when the script loads (for direct navigation)
  setTimeout(() => {
    trackUrlOpening();
  }, 1000);
  
  // Add more aggressive tracking for rapid page loads
  let pageLoadCount = 0;
  let lastPageLoadTime = 0;
  
  // Store original function reference
  const originalStartContinuousJobExtraction = startContinuousJobExtraction;
  
  // Override the startContinuousJobExtraction to add delays
  window.startContinuousJobExtraction = function() {
    // Check if we need to delay before starting extraction
    const currentTime = Date.now();
    const timeSinceLastLoad = currentTime - lastPageLoadTime;
    const suggestedDelay = calculateSuggestedUrlDelay();
    
    if (pageLoadCount > 0 && timeSinceLastLoad < suggestedDelay) {
      const requiredDelay = suggestedDelay - timeSinceLastLoad;
      console.log(`🚫 Page load too fast! Delaying job extraction by ${requiredDelay}ms`);
      
      // Show delay in badge
      updateBadge(`Delaying ${Math.round(requiredDelay/1000)}s`, '#ff6b6b');
      
      // Delay the actual job extraction
      setTimeout(() => {
        console.log(`✅ Delay completed, starting job extraction`);
        updateBadge();
        originalStartContinuousJobExtraction.call(this);
      }, requiredDelay);
      
      return;
    }
    
    // Update tracking
    pageLoadCount++;
    lastPageLoadTime = currentTime;
    
    // Start extraction normally
    originalStartContinuousJobExtraction.call(this);
  };
}

// Track when a job URL is opened
function trackUrlOpening() {
  if (!isJobSite) return;
  
  const currentTime = Date.now();
  const timeSinceLastOpen = currentTime - urlOpeningTracker.lastUrlOpenTime;
  
  urlOpeningTracker.urlOpenCount++;
  urlOpeningTracker.lastUrlOpenTime = currentTime;
  
  // Calculate suggested delay for next URL opening
  const suggestedDelay = calculateSuggestedUrlDelay();
  urlOpeningTracker.suggestedDelay = suggestedDelay;
  
  console.log(`🌐 URL Opening #${urlOpeningTracker.urlOpenCount} tracked`);
  console.log(`⏱️ Time since last open: ${timeSinceLastOpen}ms`);
  console.log(`💡 Suggested delay for next URL: ${suggestedDelay}ms`);
  
  // Enforce actual delay if opening too fast
  if (timeSinceLastOpen < suggestedDelay && urlOpeningTracker.urlOpenCount > 1) {
    const requiredDelay = suggestedDelay - timeSinceLastOpen;
    console.log(`⏳ Enforcing delay: ${requiredDelay}ms before processing this page`);
    enforceUrlDelay(requiredDelay);
  }
}

// Enforce actual delay before processing job extraction
function enforceUrlDelay(delayMs) {
  if (urlOpeningTracker.isDelaying) {
    console.log(`⏸️ Already delaying, adding to queue`);
    urlOpeningTracker.pendingDelays.push(delayMs);
    return;
  }
  
  urlOpeningTracker.isDelaying = true;
  updateBadge(`Waiting ${Math.round(delayMs/1000)}s`, '#ffa500');
  
  console.log(`⏳ Enforcing ${delayMs}ms delay before job extraction`);
  
  setTimeout(() => {
    urlOpeningTracker.isDelaying = false;
    updateBadge();
    
    // Process any pending delays
    if (urlOpeningTracker.pendingDelays.length > 0) {
      const nextDelay = urlOpeningTracker.pendingDelays.shift();
      console.log(`⏳ Processing pending delay: ${nextDelay}ms`);
      enforceUrlDelay(nextDelay);
    }
    
    // Now allow job extraction to proceed
    console.log(`✅ Delay completed, job extraction can proceed`);
  }, delayMs);
}

// Calculate suggested delay between opening URLs
function calculateSuggestedUrlDelay() {
  if (aiProvider !== 'gemini') {
    return 1000; // 1 second for OpenAI
  }
  
  const geminiKeyCount = geminiKeys.filter(key => key.status === 'valid').length;
  
  if (geminiKeyCount <= 1) {
    return 6000; // 6 seconds for single key
  }
  
  // Estimate user might open 30-60 job pages
  const estimatedPages = 45;
  
  // Calculate optimal delay: 60 seconds / estimated pages
  const totalTimeSeconds = 60;
  const delayPerPage = (totalTimeSeconds * 1000) / estimatedPages;
  
  // Adjust based on number of keys (more keys = can open faster)
  const adjustedDelay = delayPerPage / Math.sqrt(geminiKeyCount);
  
  // Minimum 1 second, maximum 10 seconds
  const finalDelay = Math.max(1000, Math.min(10000, adjustedDelay));
  
  console.log(`📊 URL delay calculation: ${geminiKeyCount} keys, ~${estimatedPages} pages, ${finalDelay.toFixed(0)}ms delay`);
  
  return Math.round(finalDelay);
}

// Show timing suggestion in badge
function showUrlTimingSuggestion() {
  const suggestedDelaySeconds = Math.round(urlOpeningTracker.suggestedDelay / 1000);
  updateBadge(`Wait ${suggestedDelaySeconds}s`, '#ffa500');
  
  // Clear suggestion after delay
  setTimeout(() => {
    if (jobInfo && jobInfo.position) {
      updateBadge();
    }
  }, 3000);
}

// Get timing information for user
function getUrlTimingInfo() {
  const suggestedDelaySeconds = Math.round(urlOpeningTracker.suggestedDelay / 1000);
  const geminiKeyCount = geminiKeys.filter(key => key.status === 'valid').length;
  
  return {
    suggestedDelay: suggestedDelaySeconds,
    keyCount: geminiKeyCount,
    urlCount: urlOpeningTracker.urlOpenCount,
    canOpenFaster: geminiKeyCount > 1
  };
}

async function updateKeyUsage(keyId, tokensUsed = 0) {
  const keys = aiProvider === 'openai' ? openaiKeys : geminiKeys;
  const key = keys.find(k => k.id === keyId);
  
  if (key) {
    if (!key.usage) {
      key.usage = {
        requestsToday: 0,
        tokensToday: 0,
        lastReset: new Date().toDateString(),
        rateLimitReset: null,
        isRateLimited: false
      };
    }
    
    // Reset daily counters if it's a new day
    const today = new Date().toDateString();
    if (key.usage.lastReset !== today) {
      key.usage.requestsToday = 0;
      key.usage.tokensToday = 0;
      key.usage.lastReset = today;
      key.usage.isRateLimited = false;
    }
    
    key.usage.requestsToday += 1;
    key.usage.tokensToday += tokensUsed;
    
    // Calculate cost for OpenAI (GPT-4 pricing: $0.03/1K input tokens, $0.06/1K output tokens)
    if (aiProvider === 'openai' && tokensUsed > 0) {
      // Estimate: assume 70% input tokens, 30% output tokens for job extraction
      const inputTokens = Math.round(tokensUsed * 0.7);
      const outputTokens = Math.round(tokensUsed * 0.3);
      const inputCost = (inputTokens / 1000) * 0.03;
      const outputCost = (outputTokens / 1000) * 0.06;
      const requestCost = inputCost + outputCost;
      
      key.usage.costToday = (key.usage.costToday || 0) + requestCost;
      console.log(`💰 Cost for this request: $${requestCost.toFixed(4)} (Total today: $${key.usage.costToday.toFixed(4)})`);
    }
    
        // Check if key is approaching limits (only for Gemini)
    if (aiProvider === 'gemini') {
      const maxRequests = 250;
      const maxTokens = 250000;

      if (key.usage.requestsToday >= maxRequests || key.usage.tokensToday >= maxTokens) {
        key.usage.isRateLimited = true;
        key.usage.rateLimitReset = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        console.log(`🚫 Gemini key ${key.masked} reached daily limits and marked as rate limited`);
      }
    }
    
    // Save updated usage to storage
    chrome.storage.sync.set({
      [aiProvider === 'openai' ? 'openaiKeys' : 'geminiKeys']: keys
    });
  }
}

async function extractJobInfo() {
  if (!isJobSite) {
    return;
  }
  
  // Check if we're in a delay period
  if (urlOpeningTracker.isDelaying) {
    console.log(`⏸️ Job extraction blocked - waiting for URL delay to complete`);
    return;
  }
  
  // Get an available API key (not rate limited)
  let currentApiKey = null;
  let currentKeyId = null;
  
  const availableKey = await getAvailableApiKey();
  if (availableKey) {
    currentApiKey = availableKey.key;
    currentKeyId = availableKey.id;
    console.log(`Using available key: ${availableKey.masked}`);
  } else {
    console.log('All API keys are rate limited or exhausted');
    updateBadge('All keys limited', '#ff6b6b');
    return;
  }
  
  // Prevent multiple simultaneous requests
  if (isRequestInProgress) {
    blockedRequests++;
    console.log(`⏸️ Request already in progress, skipping... (${blockedRequests} blocked)`);
    return;
  }
  
  // Set request lock
  isRequestInProgress = true;
  console.log(`🔒 Starting job extraction attempt ${loadAttempts}/${maxLoadAttempts} at ${new Date().toLocaleTimeString()}`);
  
      // Check RPM limit for Gemini only (OpenAI has no RPM limits)
    if (aiProvider === 'gemini') {
      const keys = geminiKeys;
      const key = keys.find(k => k.id === currentKeyId);
      if (key) {
        const now = Date.now();
        const oneMinuteAgo = now - 60000; // 60 seconds
        
        // Initialize requestsInLastMinute if not exists
        if (!key.usage.requestsInLastMinute) {
          key.usage.requestsInLastMinute = [];
        }
        
        // Remove requests older than 1 minute
        key.usage.requestsInLastMinute = key.usage.requestsInLastMinute.filter(timestamp => timestamp > oneMinuteAgo);
        
        // Check if we've hit the RPM limit
        if (key.usage.requestsInLastMinute.length >= 10) {
          console.log('🚫 Gemini RPM limit reached (10 requests/minute), waiting...');
          isRequestInProgress = false;
          updateBadge('RPM limit reached', '#ff6b6b');
          return;
        }
        
        // Add current request timestamp
        key.usage.requestsInLastMinute.push(now);
      }
    }
  
  loadAttempts++;

  
  try {  
    const jobElements = collectJobElements();
    let pageContent = '';
     pageContent = jobElements;
     
     // Validate that we have content
     if (!pageContent || pageContent.trim().length === 0) {
       console.error('❌ No page content found');
       lastLoadError = 'No page content available';
       updateBadge();
       return;
     }
     
    //  Truncate content to prevent API errors (keep first 50000 characters for GPT-4 Turbo)
     if (pageContent.length > 50000) {
       pageContent = pageContent.substring(0, 50000) + '... [Content truncated]';
     }
     console.log('Page Content:', pageContent);
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
     const timeoutId = setTimeout(() => {
       controller.abort();
       console.log('⏰ Request timeout - aborting');
     }, 15000); // 15 second timeout
    
    let response;
    if (aiProvider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: `Extract job information from the following HTML content. Return ONLY a JSON object with these exact fields:

"position": The EXACT job title/role as written on the page - PRESERVE EVERYTHING including:
- PRIORITY: Look for job titles in <h1> tags first, then <h2>, <h3> tags, page titles, job posting headers
- H1 tags typically contain the main job title (e.g., "Senior Software Engineer")
- Do NOT modify, shorten, or customize the title in any way

"company": The hiring company name (e.g., "Metronome", "Axuall", "Jumpapp.com", "AutoAssist", "Samsara", "Maple", "KeyBank", "Immuta", "Staff4Me"). Look for company names in page titles, headers, logos, "About" sections, or company descriptions. IMPORTANT: Check the page title first - if it contains both job title and company name (e.g., "Senior Software Engineer - Staff4Me"), extract the company name part. Also look for company names in H1, H2, H3 elements and header areas. If company name is not clearly identifiable, use empty string "".

"jobType": Analyze work arrangement from FULL CONTENT:

**SEMANTIC ANALYSIS**: Look for work arrangement patterns, location requirements, and physical presence needs.

**"Remote"** = Work from anywhere with no physical office presence required:
- Job explicitly states "remote", "work from anywhere", "distributed team"
- No mention of office visits, commute, or physical presence
- May have geographic restrictions (US only, Canada only, etc.) but still fully remote
- **NO relocation requirements** - candidates can work from their current location
- Examples: "remote within US", "work from anywhere in Canada", "fully distributed team"

**"Hybrid"** = Requires some physical office presence:
- Job mentions hybrid schedules, office visits, or commute requirements
- Requires living near specific office locations
- Mix of remote and in-office work
- **May require relocation** to specific states/regions
- Examples: "hybrid schedule", "2 days in office", "must be near our office", "willing to relocate"

**"On-site"** = Requires physical office presence:
- Job requires relocation or living in specific city
- No remote work options mentioned
- Must commute to office location
- **Definitely requires relocation** to specific location

**Use "Remote" for jobs that are fully remote even if they have geographic restrictions (like US/Canada only).**

Use "" if unclear or insufficient information.

"industry": Industry classification - Analyze the FULL CONTENT to determine the company's industry. Look for industry-specific keywords, company descriptions, product/service mentions, and business context. Examples: Healthcare, Fintech, E-commerce, SaaS, Manufacturing, Education, Retail, etc. Return the most specific industry category, or "" if unclear.
"companySize": Company size classification - Analyze the FULL CONTENT to determine the company's size and stage. **PRIORITIZE explicit company descriptions over team size numbers.**

**PRIMARY INDICATORS** (Look for these first):
- Direct company status statements: "we are a startup", "we are a scale-up company", "we are an enterprise", "we are a growing startup"
- Company stage descriptions: "early-stage startup", "fast-growing startup", "established company", "mature company"
- Funding stage mentions: "seed-stage", "Series A startup", "Series B company", "Series C company", "pre-IPO", "public company"
- Company maturity: "newly founded", "recently launched", "well-established", "industry leader", "Fortune 500"

**SECONDARY INDICATORS** (Use if no explicit descriptions found):
- Team size numbers: "team of X people", "X+ employees", "X-person team", "X employees"
- Employee count: "50 employees", "200+ people", "1000+ staff"
- Company growth: "rapidly growing", "expanding team", "hiring aggressively"

**Classification Rules:**
- "Startup" (1-50 employees, early stage, pre-Series A, seed stage) - Examples: "we are a startup", "early-stage company", "10-person team", "seed-stage startup"
- "Scale-up" (51-200 employees, growing company, Series A/B, rapid growth) - Examples: "we are a scale-up", "Series A company", "100+ people", "fast-growing startup"
- "Mid-size" (201-1000 employees, established company, Series C+, stable growth) - Examples: "Series C company", "700+ people", "established company", "profitable company"
- "Enterprise" (1000+ employees, large corporation, public company, Fortune 500) - Examples: "Fortune 500", "public company", "5000+ employees", "multinational corporation"
- "Unknown" (size not clearly indicated or insufficient information)

**IMPORTANT**: If a company explicitly states "we are a startup" but has 200+ employees, still classify as "Startup" based on their self-description.

"teamSize": Extract the actual team size or employee count mentioned in the job posting. Look for phrases like:
- "team of X people", "X+ employees", "X-person team", "X employees"
- "X staff members", "X team members", "X people", "X workers"
- "global team of X", "distributed team of X", "remote team of X"
- Employee count numbers (e.g., "700+ people", "50 employees", "200+ team members")

Return the exact phrase found (e.g., "700+ people", "50 employees", "team of 25") or "Not specified" if no team size is mentioned.

"foundedDate": Extract the company's founding date or establishment year. Look for phrases like:
- "founded in XXXX", "established in XXXX", "started in XXXX"
- "since XXXX", "since XXXX", "launched in XXXX"
- "company founded XXXX", "we've been around since XXXX"
- "XXXX startup", "founded XXXX", "established XXXX"
- Year mentions in company history: "in XXXX we started", "back in XXXX"

Return the exact phrase found (e.g., "founded in 2015", "since 2020", "established 2018") or "Not specified" if no founding date is mentioned.

"companyType": Extract the company's business type or category. Look for phrases like:
- "startup", "scale-up", "enterprise", "corporation", "company"
- "SaaS company", "tech startup", "fintech startup", "healthtech company"
- "B2B company", "B2C company", "marketplace", "platform"
- "consulting firm", "agency", "studio", "lab", "incubator"
- "public company", "private company", "non-profit", "NGO"
- "Fortune 500", "unicorn", "decacorn", "IPO company"

Return the exact phrase found (e.g., "startup", "SaaS company", "Fortune 500") or "Not specified" if no company type is mentioned.

"jobSummary": Create a concise 3-5 sentence summary of the job posting that covers:
1. What the company does (their business/product/service)
2. What they're building or developing
3. What they're looking to hire for (role purpose/goals)
4. Key company highlights or achievements (if mentioned)
5. Growth plans or future direction (if mentioned)

Focus on the most important and interesting aspects. Write in clear, engaging sentences that give a complete picture of the opportunity. Avoid repetitive information and keep it informative but concise.
"skills": Top 8 required skills or tech stack - Analyze the FULL CONTENT to identify the most important technical skills, programming languages, frameworks, tools, or technologies required for this position. Look for skills mentioned in job requirements, qualifications, "what you'll need" sections, and technical specifications. Return as an array of exactly 8 skills, or fewer if less than 8 are clearly specified. Examples: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"] or ["Python", "Machine Learning", "TensorFlow", "SQL", "Git"]. If no specific skills found, return empty array [].
"matchRate": Calculate an ATS (Applicant Tracking System) match rate percentage (0-100) between the user's resume and this job posting. ATS systems scan for specific keywords and phrases to rank candidates. Focus on:

1. **Exact Keyword Matches**: Programming languages, frameworks, tools mentioned in both resume and job posting
2. **Technical Skills**: Specific technologies, platforms, methodologies that appear in both
3. **Industry Terms**: Domain-specific terminology and buzzwords
4. **Certifications**: Professional certifications and qualifications
5. **Experience Keywords**: Years of experience, project types, team sizes mentioned


**Focus on keyword density and exact matches that ATS systems prioritize for automated screening.**

Return only the percentage number (e.g., 85) without any text or symbols.

The HTML structure will help you identify the main job title and company name more accurately.

Look for work arrangement patterns, location requirements, flexibility mentions, and company policies. Pay special attention to physical presence requirements: commute, relocate, in-office meetings, travel requirements, and whether the job allows work from anywhere or requires specific location presence.

CRITICAL: Return ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting. The response must start with { and end with }. If any field is missing, use empty string "".`
        }, {
          role: 'user',
          content: `Job Posting Content:
${pageContent}

User Work Experience:
${userWorkExperience || 'No work experience provided'}

User Location: ${userLocation || 'Not specified'}`
        }],
        max_tokens: 1000,
        temperature: 0.1
      }),
      signal: controller.signal
    });
    } else {
      // Gemini API call
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${currentApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract job information from the following HTML content. Return ONLY a JSON object with these exact fields:

"position": The EXACT job title/role as written on the page - PRESERVE EVERYTHING including:
- PRIORITY: Look for job titles in <h1> tags first, then <h2>, <h3> tags, page titles, job posting headers
- H1 tags typically contain the main job title (e.g., "Senior Software Engineer")
- Do NOT modify, shorten, or customize the title in any way

"company": The hiring company name (e.g., "Metronome", "Axuall", "Jumpapp.com", "AutoAssist", "Samsara", "Maple", "KeyBank", "Immuta", "Staff4Me"). Look for company names in page titles, headers, logos, "About" sections, or company descriptions. IMPORTANT: Check the page title first - if it contains both job title and company name (e.g., "Senior Software Engineer - Staff4Me"), extract the company name part. Also look for company names in H1, H2, H3 elements and header areas. If company name is not clearly identifiable, use empty string "".

"jobType": Analyze work arrangement from FULL CONTENT:

**SEMANTIC ANALYSIS**: Look for work arrangement patterns, location requirements, and physical presence needs.

**"Remote"** = Work from anywhere with no physical office presence required:
- Job explicitly states "remote", "work from anywhere", "distributed team"
- No mention of office visits, commute, or physical presence
- May have geographic restrictions (US only, Canada only, etc.) but still fully remote
- **NO relocation requirements** - candidates can work from their current location
- Examples: "remote within US", "work from anywhere in Canada", "fully distributed team"

**"Hybrid"** = Requires some physical office presence:
- Job mentions hybrid schedules, office visits, or commute requirements
- Requires living near specific office locations
- Mix of remote and in-office work
- **May require relocation** to specific states/regions
- Examples: "hybrid schedule", "2 days in office", "must be near our office", "willing to relocate"

**"On-site"** = Requires physical office presence:
- Job requires relocation or living in specific city
- No remote work options mentioned
- Must commute to office location
- **Definitely requires relocation** to specific location

**Use "Remote" for jobs that are fully remote even if they have geographic restrictions (like US/Canada only).**

Use "" if unclear or insufficient information.

"industry": Industry classification - Analyze the FULL CONTENT to determine the company's industry. Look for industry-specific keywords, company descriptions, product/service mentions, and business context. Examples: Healthcare, Fintech, E-commerce, SaaS, Manufacturing, Education, Retail, etc. Return the most specific industry category, or "" if unclear.
"companySize": Company size classification - Analyze the FULL CONTENT to determine the company's size and stage. **PRIORITIZE explicit company descriptions over team size numbers.**

**PRIMARY INDICATORS** (Look for these first):
- Direct company status statements: "we are a startup", "we are a scale-up company", "we are an enterprise", "we are a growing startup"
- Company stage descriptions: "early-stage startup", "fast-growing startup", "established company", "mature company"
- Funding stage mentions: "seed-stage", "Series A startup", "Series B company", "Series C company", "pre-IPO", "public company"
- Company maturity: "newly founded", "recently launched", "well-established", "industry leader", "Fortune 500"

**SECONDARY INDICATORS** (Use if no explicit descriptions found):
- Team size numbers: "team of X people", "X+ employees", "X-person team", "X employees"
- Employee count: "50 employees", "200+ people", "1000+ staff"
- Company growth: "rapidly growing", "expanding team", "hiring aggressively"

**Classification Rules:**
- "Startup" (1-50 employees, early stage, pre-Series A, seed stage) - Examples: "we are a startup", "early-stage company", "10-person team", "seed-stage startup"
- "Scale-up" (51-200 employees, growing company, Series A/B, rapid growth) - Examples: "we are a scale-up", "Series A company", "100+ people", "fast-growing startup"
- "Mid-size" (201-1000 employees, established company, Series C+, stable growth) - Examples: "Series C company", "700+ people", "established company", "profitable company"
- "Enterprise" (1000+ employees, large corporation, public company, Fortune 500) - Examples: "Fortune 500", "public company", "5000+ employees", "multinational corporation"
- "Unknown" (size not clearly indicated or insufficient information)

**IMPORTANT**: If a company explicitly states "we are a startup" but has 200+ employees, still classify as "Startup" based on their self-description.

"teamSize": Extract the actual team size or employee count mentioned in the job posting. Look for phrases like:
- "team of X people", "X+ employees", "X-person team", "X employees"
- "X staff members", "X team members", "X people", "X workers"
- "global team of X", "distributed team of X", "remote team of X"
- Employee count numbers (e.g., "700+ people", "50 employees", "200+ team members")

Return the exact phrase found (e.g., "700+ people", "50 employees", "team of 25") or "Not specified" if no team size is mentioned.

"foundedDate": Extract the company's founding date or establishment year. Look for phrases like:
- "founded in XXXX", "established in XXXX", "started in XXXX"
- "since XXXX", "since XXXX", "launched in XXXX"
- "company founded XXXX", "we've been around since XXXX"
- "XXXX startup", "founded XXXX", "established XXXX"
- Year mentions in company history: "in XXXX we started", "back in XXXX"

Return the exact phrase found (e.g., "founded in 2015", "since 2020", "established 2018") or "Not specified" if no founding date is mentioned.

"companyType": Extract the company's business type or category. Look for phrases like:
- "startup", "scale-up", "enterprise", "corporation", "company"
- "SaaS company", "tech startup", "fintech startup", "healthtech company"
- "B2B company", "B2C company", "marketplace", "platform"
- "consulting firm", "agency", "studio", "lab", "incubator"
- "public company", "private company", "non-profit", "NGO"
- "Fortune 500", "unicorn", "decacorn", "IPO company"

Return the exact phrase found (e.g., "startup", "SaaS company", "Fortune 500") or "Not specified" if no company type is mentioned.

"jobSummary": Create a concise 3-5 sentence summary of the job posting that covers:
1. What the company does (their business/product/service)
2. What they're building or developing
3. What they're looking to hire for (role purpose/goals)
4. Key company highlights or achievements (if mentioned)
5. Growth plans or future direction (if mentioned)

Focus on the most important and interesting aspects. Write in clear, engaging sentences that give a complete picture of the opportunity. Avoid repetitive information and keep it informative but concise.
"skills": Top 8 required skills or tech stack - Analyze the FULL CONTENT to identify the most important technical skills, programming languages, frameworks, tools, or technologies required for this position. Look for skills mentioned in job requirements, qualifications, "what you'll need" sections, and technical specifications. Return as an array of exactly 8 skills, or fewer if less than 8 are clearly specified. Examples: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"] or ["Python", "Machine Learning", "TensorFlow", "SQL", "Git"]. If no specific skills found, return empty array [].
"matchRate": Calculate an ATS (Applicant Tracking System) match rate percentage (0-100) between the user's resume and this job posting. ATS systems scan for specific keywords and phrases to rank candidates. Focus on:


**Focus on keyword density and exact matches that ATS systems prioritize for automated screening.**

Return only the percentage number (e.g., 85) without any text or symbols.

The HTML structure will help you identify the main job title and company name more accurately.

Look for work arrangement patterns, location requirements, flexibility mentions, and company policies. Pay special attention to physical presence requirements: commute, relocate, in-office meetings, travel requirements, and whether the job allows work from anywhere or requires specific location presence.

CRITICAL: Return ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting. The response must start with { and end with }. If any field is missing, use empty string "".

Job Posting Content:
${pageContent}

User Work Experience:
${userWorkExperience || 'No work experience provided'}

User Location: ${userLocation || 'Not specified'}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        }),
        signal: controller.signal
      });
    }
    
    clearTimeout(timeoutId); // Clear timeout if successful
    
    if (response.ok) {
      const data = await response.json();
      let content;
      
      // Update usage tracking
      const tokensUsed = aiProvider === 'openai' ? 
        (data.usage?.total_tokens || 0) : 
        (data.usageMetadata?.totalTokenCount || 0);
      await updateKeyUsage(currentKeyId, tokensUsed);
      
      if (aiProvider === 'openai') {
        content = data.choices[0].message.content;
      } else {
        // Gemini response format
        content = data.candidates[0].content.parts[0].text;
      }

      
      try {
        // Clean the content to handle markdown-wrapped JSON
        let cleanedContent = content.trim();
        
        console.log('🔍 Original AI response:', content);
        
        // Remove markdown code block wrappers if present
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\s*/, '');
        }
        if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*/, '');
        }
        if (cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.replace(/\s*```$/, '');
        }
        
        // Check if content looks like JSON (starts with { or [)
        const trimmedContent = cleanedContent.trim();
        if (!trimmedContent.startsWith('{') && !trimmedContent.startsWith('[')) {
          console.log('❌ Content does not start with JSON structure');
          console.log('❌ First 50 characters:', trimmedContent.substring(0, 50));
          lastLoadError = 'AI returned non-JSON response: ' + trimmedContent.substring(0, 100);
              updateBadge();
          return;
        }
        cleanedContent = trimmedContent;
        
        // Remove markdown code block wrappers if present
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\s*/, '');
        }
        if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*/, '');
        }
        if (cleanedContent.endsWith('```')) {
          cleanedContent = cleanedContent.replace(/\s*```$/, '');
        }
        
        // Remove any leading/trailing whitespace and quotes
        cleanedContent = cleanedContent.trim();
        if (cleanedContent.startsWith("'") && cleanedContent.endsWith("'")) {
          cleanedContent = cleanedContent.slice(1, -1);
        }
        if (cleanedContent.startsWith('"') && cleanedContent.endsWith('"')) {
          cleanedContent = cleanedContent.slice(1, -1);
        }
                
        const jobData = JSON.parse(cleanedContent);
        
        if (jobData && jobData.position) {
          // Validate that company and position are not the same
          const position = jobData.position.trim();
          const company = (jobData.company || '').trim();
          const jobType = (jobData.jobType || '').trim();
          
          jobInfo = {
            position: position,
            company: company,
            jobType: jobType,
            industry: (jobData.industry || '').trim(),
            companySize: (jobData.companySize || '').trim(),
            teamSize: (jobData.teamSize || '').trim(),
            foundedDate: (jobData.foundedDate || '').trim(),
            companyType: (jobData.companyType || '').trim(),
            jobSummary: (jobData.jobSummary || '').trim(),
            skills: Array.isArray(jobData.skills) ? jobData.skills : [],
            matchRate: jobData.matchRate || 0
          };
          loadFailed = false;
          lastLoadError = null;
          updateBadge(); // Refresh badge with job info
        } else {
          // No valid job data found
          lastLoadError = 'Incomplete job data from AI';
            updateBadge();
        }
      } catch (e) {
        // JSON parse failed
        console.log('❌ JSON Parse Error:', e.message);
        console.log('📄 Original content:', content);
        lastLoadError = 'JSON Parse Error: ' + e.message;
          updateBadge();
      }
    } else {
      // API request failed
      const errorText = await response.text();
      
      // Handle rate limiting (only for Gemini)
      if (response.status === 429 && aiProvider === 'gemini') {
        console.log('Gemini rate limit hit, marking key as limited and trying another key...');
        const key = geminiKeys.find(k => k.id === currentKeyId);
        if (key) {
          key.usage = key.usage || {};
          key.usage.isRateLimited = true;
          key.usage.rateLimitReset = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
          
          // Save updated key status
          chrome.storage.sync.set({
            geminiKeys: geminiKeys
          });
          
          // Try with another available key
          const nextKey = await getAvailableApiKey();
          if (nextKey) {
            console.log(`Retrying with next available Gemini key: ${nextKey.masked}`);
            // Recursive call with new key
            return await extractJobInfo();
          }
        }
      }
      
      lastLoadError = `API Error: ${response.status} - ${errorText}`;
        updateBadge();
    }
  } catch (error) {
      // Handle network or other errors
      if (error.name === 'AbortError') {
        lastLoadError = 'Request Timeout (15s)';
      } else if (error.message && error.message.includes('Unauthorized')) {
        lastLoadError = 'Authentication Error - Check API Key';
        loadFailed = true; // Stop retrying on auth errors
      } else if (error.message && error.message.includes('401')) {
        lastLoadError = 'API Authentication Failed';
        loadFailed = true; // Stop retrying on auth errors
      } else {
        lastLoadError = error.message || 'Network Error';
      }
      updateBadge();
  } finally {
    // Always unlock the request when done (success or failure)
    isRequestInProgress = false;
    console.log('🔓 Request lock released');
  }
}

// Load saved badge position
function loadBadgePosition(badge) {
  chrome.storage.sync.get(['badgePosition'], (result) => {
    if (result.badgePosition) {
      const position = result.badgePosition;
      
      // Set the position
      badge.style.left = position.left;
      badge.style.top = position.top;
      
      // Ensure badge is within viewport bounds
      const rect = badge.getBoundingClientRect();
      const maxLeft = window.innerWidth - badge.offsetWidth;
      const maxTop = window.innerHeight - badge.offsetHeight;
      
      const currentLeft = parseInt(position.left);
      const currentTop = parseInt(position.top);
      
      if (currentLeft > maxLeft || currentTop > maxTop) {
        // Reset to default position if out of bounds
        badge.style.left = '20px';
        badge.style.top = '20px';
      }
    } else {
      // Set default position if no saved position
      badge.style.left = '20px';
      badge.style.top = '20px';
    }
  });
}

// Initialize badge position (legacy function - kept for compatibility)
function initializeBadgePosition(position) {
  const badge = document.getElementById('keyword-highlighter-badge');
  if (badge && position && position.left && position.top) {
    badge.style.left = position.left;
    badge.style.top = position.top;
  }
}

// Initialize the highlighter
function initializeHighlighter() {
  if (keywords.length === 0) return;

  // Load Job Radar state from storage
  chrome.storage.sync.get(['jobRadarEnabled'], function(result) {
    jobRadarEnabled = result.jobRadarEnabled !== false; // Default to true if not set

  // Reset load status for new page
  resetLoadStatus();

  // Clear previous observer
  if (observer) {
    observer.disconnect();
  }

  // Check if this is a job site
  isJobSite = detectJobSite();
  
  // Initialize URL opening tracker for job sites
  if (isJobSite) {
    initializeUrlOpeningTracker();
  }
  
  // If this is a job site, keep highlighting active regardless of Job Radar toggle
  if (isJobSite) {
    // Only show badge and run job extraction when Job Radar is enabled
    if (jobRadarEnabled) {
        // Check if we have a valid API key for the current provider
        let hasValidApiKey = false;
        if (aiProvider === 'openai' && selectedOpenaiKey) {
          const key = openaiKeys.find(k => k.id === selectedOpenaiKey);
          hasValidApiKey = key && key.status === 'valid';
        } else if (aiProvider === 'gemini' && selectedGeminiKey) {
          const key = geminiKeys.find(k => k.id === selectedGeminiKey);
          hasValidApiKey = key && key.status === 'valid';
        }
        
        // Extract job information if we have a valid API key
        if (hasValidApiKey) {
        startContinuousJobExtraction();
      }
      
      // Show the badge
      updateBadge();
    } else {
      // Hide/remove the badge if it exists when disabled
      const existingBadge = document.getElementById('keyword-highlighter-badge');
      if (existingBadge) {
        existingBadge.remove();
      }
    }

    // Initial highlight for existing content (runs regardless of toggle)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(highlightKeywords, 1000);
      });
    } else {
      setTimeout(highlightKeywords, 1000);
    }
    
    // Start continuous keyword monitoring regardless of toggle
    startContinuousKeywordMonitoring();
  } else {
    // Non-job sites: hide/remove the badge if it exists and stop further processing
    const existingBadge = document.getElementById('keyword-highlighter-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    return;
  }
  
  // Test keyword detection
  setTimeout(testKeywordDetection, 2000);

  // Set up MutationObserver for dynamic content
  observer = new MutationObserver((mutations) => {
    let shouldHighlight = false;

    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && !containsHighlights(node) && !processedElements.has(node) && !isInsideBadge(node)) {
            shouldHighlight = true;
          }
        });
      }
    });

    if (shouldHighlight && !isProcessing) {
      clearTimeout(window.highlightTimeout);
      window.highlightTimeout = setTimeout(highlightKeywords, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  }); // Close the chrome.storage.sync.get callback
}

// Monitor URL changes to update badge visibility
let currentUrl = window.location.href;
function checkUrlChange() {
  const newUrl = window.location.href;
  if (newUrl !== currentUrl) {
    currentUrl = newUrl;
    
    // Small delay to ensure page has loaded
    setTimeout(() => {
      initializeHighlighter();
    }, 1000);
  }
}

// Set up URL change monitoring
setInterval(checkUrlChange, 2000);

// Check if element is inside the badge area
function isInsideBadge(element) {
  const badge = document.getElementById('keyword-highlighter-badge');
  if (!badge) return false;

  return badge.contains(element) || element.contains(badge);
}

// Check if element already contains highlights
function containsHighlights(element) {
  return element.querySelector && element.querySelector('.keyword-highlight') !== null;
}

// Count current keyword matches
function countKeywordMatches() {
  const highlights = document.querySelectorAll('.keyword-highlight');
  let totalMatches = 0;
  
  highlights.forEach(highlight => {
    if (!isInsideBadge(highlight)) {
      totalMatches++;
    }
  });
  
  return totalMatches;
}

// Test keyword detection manually
function testKeywordDetection() {
  
  
  keywords.forEach(keywordObj => {
    const regex = new RegExp(`\\b${escapeRegExp(keywordObj.text)}\\b`, 'gi');
    const matches = document.body.innerText.match(regex);
    if (matches) {
    }
  });
}


// Escape HTML for safe display
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Escape regex special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Copy job information to clipboard in tab-separated format
function copyJobToClipboard() {
  
  if (!jobInfo) {
    showCopyError('No job info available');
    return;
  }
  
  try {
    // Get current job URL
    const jobUrl = window.location.href;
    
    // Clean the data to prevent issues with tabs/newlines
    const cleanCompany = jobInfo.company.replace(/[\t\n\r]/g, ' ').trim();
    const cleanPosition = jobInfo.position.replace(/[\t\n\r]/g, ' ').trim();
    const cleanIndustry = jobInfo.industry.replace(/[\t\n\r]/g, ' ').trim();
    
    // Load copy preferences (defaults: includeIndustry=false, includeCompanySize=false, includeFoundedDate=false, includeTechStack=false, includeMatchRate=false)
    chrome.storage.sync.get(['copyIncludeIndustry', 'copyIncludeCompanySize', 'copyIncludeFoundedDate', 'copyIncludeTechStack', 'copyIncludeMatchRate'], (prefs) => {
      const includeIndustry = prefs.copyIncludeIndustry === true;
      const includeCompanySize = prefs.copyIncludeCompanySize === true;
      const includeFoundedDate = prefs.copyIncludeFoundedDate === true;
      const includeTechStack = prefs.copyIncludeTechStack === true;
      const includeMatchRate = prefs.copyIncludeMatchRate === true;

      // Build tab-separated fields
      const fields = [cleanCompany, cleanPosition, jobUrl];
      if (includeIndustry) {
        fields.push(cleanIndustry);
      }
      if (includeCompanySize) {
        const cleanCompanySize = jobInfo.companySize.replace(/[\t\n\r]/g, ' ').trim();
        fields.push(cleanCompanySize);
      }
      if (includeFoundedDate) {
        const cleanFoundedDate = jobInfo.foundedDate.replace(/[\t\n\r]/g, ' ').trim();
        fields.push(cleanFoundedDate);
      }
      if (includeTechStack) {
        const techStack = Array.isArray(jobInfo.skills) ? jobInfo.skills.join(', ') : '';
        fields.push(techStack);
      }
      if (includeMatchRate) {
        fields.push(String(jobInfo.matchRate || ''));
      }

      const copyText = fields.join('\t');
    
    
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(() => {
          showCopySuccess();
        }).catch(err => {
          console.error('Modern clipboard API failed:', err);
          useFallbackCopy(copyText);
        });
      } else {
        useFallbackCopy(copyText);
      }
    });
  } catch (error) {
    console.error('Error copying job info:', error);
    showCopyError('Copy failed');
  }
}

// Fallback copy method for older browsers
function useFallbackCopy(copyText) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = copyText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (success) {
      showCopySuccess();
    } else {
      console.error('Fallback copy method failed');
      showCopyError('Copy failed');
    }
  } catch (fallbackError) {
    console.error('Fallback copy error:', fallbackError);
    showCopyError('Copy failed');
  }
}

// Show copy success feedback
function showCopySuccess() {
  const button = document.querySelector('.copy-job-btn');
  if (button) {
    const originalText = button.innerHTML;
    button.innerHTML = '✅';
    button.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
    
    // Reset button after 2 seconds
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 2000);
  }
}

// Show copy error feedback
function showCopyError(message) {
  const button = document.querySelector('.copy-job-btn');
  if (button) {
    const originalText = button.innerHTML;
    button.innerHTML = '❌';
    button.style.background = 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)';
    
    // Reset button after 2 seconds
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 2000);
  }
}

// Remove all highlights
function removeHighlights() {
  document.querySelectorAll('.keyword-highlight').forEach(highlight => {
    if (!isInsideBadge(highlight)) {
      const parent = highlight.parentNode;
      parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
      parent.normalize();
    }
  });
}

// Generate cover letter using AI
async function generateCoverLetter() {
  const promptTextarea = document.querySelector('.cover-letter-prompt');
  const generateBtn = document.querySelector('.generate-cover-letter-btn');
  const coverLetterDisplay = document.querySelector('.generated-cover-letter');
  const coverLetterContent = document.querySelector('.cover-letter-content');
  
  if (!promptTextarea || !generateBtn || !coverLetterDisplay || !coverLetterContent) {
    console.error('Cover letter elements not found');
    return;
  }
  
  const prompt = promptTextarea.value.trim();
  if (!prompt) {
    alert('Please enter a cover letter prompt first.');
    return;
  }
  
  // Check if we have a valid API key for the current provider
  let hasValidApiKey = false;
  let currentApiKey = null;
  if (aiProvider === 'openai' && selectedOpenaiKey) {
    const key = openaiKeys.find(k => k.id === selectedOpenaiKey);
    hasValidApiKey = key && key.status === 'valid';
    currentApiKey = key ? key.key : null;
  } else if (aiProvider === 'gemini' && selectedGeminiKey) {
    const key = geminiKeys.find(k => k.id === selectedGeminiKey);
    hasValidApiKey = key && key.status === 'valid';
    currentApiKey = key ? key.key : null;
  }
  
  if (!hasValidApiKey || !currentApiKey) {
    alert(`Please configure your ${aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} API key in the AI Settings tab first.`);
    return;
  }
  
  if (!userWorkExperience) {
    alert('Please add your work experience in the Profile tab first.');
    return;
  }
  
  // Show loading state
  generateBtn.textContent = '⏳';
  generateBtn.disabled = true;
  generateBtn.title = 'Generating...';
  
  try {
    // Get the full page content
    const pageContent = collectJobElements();
    
    // Prepare the AI request
    const messages = [
      {
        role: "user",
        content: `Generate a professional cover letter based on the following:

**User's Work Experience:**
${userWorkExperience}

**User's Location:**
${userLocation || 'Not specified'}

**Job Posting Content:**
${pageContent}

**User's Cover Letter Prompt:**
${prompt}

Return only the cover letter text without any formatting or additional text.`
      }
    ];
    
    let response;
    if (aiProvider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7
      })
    });
    } else {
      // Gemini API call for cover letter generation
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${currentApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: messages[0].content
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      });
    }
    
    if (response.ok) {
      const data = await response.json();
      let coverLetter;
      
      // Update usage tracking
      const tokensUsed = aiProvider === 'openai' ? 
        (data.usage?.total_tokens || 0) : 
        (data.usageMetadata?.totalTokenCount || 0);
      await updateKeyUsage(currentKeyId, tokensUsed);
      
      if (aiProvider === 'openai') {
        coverLetter = data.choices[0].message.content.trim();
      } else {
        // Gemini response format
        coverLetter = data.candidates[0].content.parts[0].text.trim();
      }
      
      // Display the generated cover letter
      coverLetterContent.textContent = coverLetter;
      coverLetterDisplay.style.display = 'block';
      
      // Show success feedback
      generateBtn.textContent = '✅';
      generateBtn.title = 'Generated Successfully!';
      setTimeout(() => {
        generateBtn.textContent = '📤';
        generateBtn.title = 'Generate Cover Letter';
        generateBtn.disabled = false;
      }, 2000);
      
    } else {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.error('Cover letter generation failed:', error);
    alert(`Failed to generate cover letter: ${error.message}`);
    
    // Reset button state
    generateBtn.textContent = '📤';
    generateBtn.title = 'Generate Cover Letter';
    generateBtn.disabled = false;
  }
}

// Save cover letter prompt to storage
function saveCoverLetterPrompt(prompt) {
  chrome.storage.sync.set({ coverLetterPrompt: prompt }, function() {
    console.log('Cover letter prompt saved:', prompt);
  });
}

// Load cover letter prompt from storage
function loadCoverLetterPrompt() {
  chrome.storage.sync.get(['coverLetterPrompt'], function(result) {
    if (result.coverLetterPrompt) {
      const promptTextarea = document.querySelector('.cover-letter-prompt');
      if (promptTextarea) {
        promptTextarea.value = result.coverLetterPrompt;
        // Update button state based on loaded prompt
        updateGenerateButtonState(result.coverLetterPrompt);
      }
    } else {
      // No saved prompt - ensure button is disabled
      updateGenerateButtonState('');
    }
  });
}

// Update cover letter section visibility based on toggle state
function updateCoverLetterSectionVisibility() {
  const badge = document.getElementById('keyword-highlighter-badge');
  if (!badge) return;
  
  const existingCoverLetterSection = badge.querySelector('.cover-letter-section');
  if (!existingCoverLetterSection) return;
  
  // Show/hide based on toggle state
  if (coverLetterEnabled) {
    existingCoverLetterSection.style.display = 'block';
  } else {
    existingCoverLetterSection.style.display = 'none';
  }
}

// Update badge to show/hide cover letter section based on profile completion
function updateBadgeForProfile() {
  const badge = document.getElementById('keyword-highlighter-badge');
  if (!badge) return;
  
  // Check if profile is complete
  const hasProfile = userWorkExperience && userWorkExperience.trim().length > 0;
  
  // Find existing cover letter section
  let existingCoverLetterSection = badge.querySelector('.cover-letter-section');
  
  // Prevent blinking by checking if we're already in the correct state
  if (hasProfile && existingCoverLetterSection) {
    // Profile is complete and cover letter section already exists - update visibility based on toggle
    updateCoverLetterSectionVisibility();
    return;
  }
  
  if (!hasProfile && !existingCoverLetterSection) {
    // Profile is incomplete and no cover letter section exists - do nothing
    return;
  }
  
  if (hasProfile && !existingCoverLetterSection) {
    // Profile is complete but no cover letter section exists - add it
    const jobInfoSection = badge.querySelector('.job-info');
    if (jobInfoSection) {
      const coverLetterHTML = `
        <div class="cover-letter-section" style="display: ${coverLetterEnabled ? 'block' : 'none'}">
          <div class="cover-letter-title">✍️ Cover Letter Generator</div>
          <div class="cover-letter-input-container">
            <textarea 
              class="cover-letter-prompt" 
              placeholder="Enter your cover letter prompt here... (e.g., 'Write a professional cover letter highlighting my Python and React experience')"
              rows="2"
            ></textarea>
            <button class="generate-cover-letter-btn" title="Enter a prompt to enable generation" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
          
          <!-- Generated Cover Letter Display -->
          <div class="generated-cover-letter" style="display: none;">
            <div class="cover-letter-header">
              <span>📄 Generated Cover Letter</span>
              <button class="copy-cover-letter-btn" title="Copy Cover Letter">📋</button>
            </div>
            <div class="cover-letter-content"></div>
          </div>
        </div>
      `;
      
      // Insert after job info section
      jobInfoSection.insertAdjacentHTML('afterend', coverLetterHTML);
      
      // Add event listeners to new elements
      setTimeout(() => {
        const newCoverLetterSection = badge.querySelector('.cover-letter-section');
        if (newCoverLetterSection) {
          // Add generate button event listener
          const generateBtn = newCoverLetterSection.querySelector('.generate-cover-letter-btn');
          if (generateBtn) {
            generateBtn.addEventListener('click', generateCoverLetter);
          }
          
          // Add copy button event listener
          const copyBtn = newCoverLetterSection.querySelector('.copy-cover-letter-btn');
          if (copyBtn) {
            copyBtn.addEventListener('click', copyCoverLetter);
          }
          
          // Add prompt saving event listener
          const promptTextarea = newCoverLetterSection.querySelector('.cover-letter-prompt');
          if (promptTextarea) {
            promptTextarea.addEventListener('input', (e) => {
              saveCoverLetterPrompt(e.target.value);
              updateGenerateButtonState(e.target.value);
            });
            
            // Load saved prompt and update button state
            loadCoverLetterPrompt();
          }
        }
      }, 2000);
    }
  } else if (!hasProfile && existingCoverLetterSection) {
    // Profile is incomplete but cover letter section exists - remove it
    existingCoverLetterSection.remove();
  }
}

// Update generate button state based on prompt content
function updateGenerateButtonState(promptText) {
  const generateBtn = document.querySelector('.generate-cover-letter-btn');
  if (!generateBtn) return;
  
  const hasPrompt = promptText && promptText.trim().length > 0;
  
  if (hasPrompt) {
    generateBtn.disabled = false;
    generateBtn.title = 'Generate Cover Letter';
    generateBtn.classList.remove('disabled');
  } else {
    generateBtn.disabled = true;
    generateBtn.title = 'Enter a prompt to enable generation';
    generateBtn.classList.add('disabled');
  }
}

// Copy cover letter to clipboard
function copyCoverLetter() {
  const coverLetterContent = document.querySelector('.cover-letter-content');
  if (!coverLetterContent || !coverLetterContent.textContent.trim()) {
    alert('No cover letter available to copy.');
    return;
  }
  
  navigator.clipboard.writeText(coverLetterContent.textContent.trim()).then(() => {
    // Show success feedback
    const copyBtn = document.querySelector('.copy-cover-letter-btn');
    if (copyBtn) {
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅';
      copyBtn.title = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.title = 'Copy Cover Letter';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy cover letter: ', err);
    alert('Failed to copy to clipboard. Please try again.');
  });
}

// Recalculate counts from DOM
function recalculateCountsFromDOM() {
  matches = {};
  keywords.forEach(keywordObj => {
    matches[keywordObj.text] = 0;
  });

  document.querySelectorAll('.keyword-highlight').forEach(highlight => {
    if (!isInsideBadge(highlight)) {
      const text = highlight.textContent.toLowerCase();
      keywords.forEach(keywordObj => {
        if (text === keywordObj.text.toLowerCase()) {
          matches[keywordObj.text] = (matches[keywordObj.text] || 0) + 1;
        }
      });
    }
  });
}

// Create the badge element
function createBadge() {
  if (!jobRadarEnabled) {
    return null; // Don't create badge if Job Radar is disabled
  }
  
  let badge = document.getElementById('keyword-highlighter-badge');
  if (badge) {
    return badge; // Badge already exists
  }

    badge = document.createElement('div');
    badge.id = 'keyword-highlighter-badge';
    document.body.appendChild(badge);

    // Add drag handle with beautiful modern design
    const dragHandle = document.createElement('div');
    dragHandle.className = 'badge-drag-handle';
    dragHandle.innerHTML = `
      <div class="drag-icon">⋮⋮</div>
    `;
    dragHandle.style.cssText = `
      cursor: move;
      padding: 6px 10px;
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px 16px 0 0;
      user-select: none;
      color: white;
      border-bottom: 1px solid rgba(255,255,255,0.2);
      font-weight: 600;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    `;

    // Add close button to drag handle
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '✕';
    closeButton.title = 'Close Job Radar';
    closeButton.style.cssText = `
      position: absolute;
      top: 2px;
      right: 2px;
      width: 20px;
      height: 20px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 10;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.3)';
      closeButton.style.transform = 'scale(1.1)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'rgba(255, 255, 255, 0.2)';
      closeButton.style.transform = 'scale(1)';
    });
    
    closeButton.addEventListener('click', () => {
      // Hide the badge
      if (badge) {
        badge.style.display = 'none';
      }
      
      // Stop job extraction but keep highlighting active
      if (window.extractionInterval) {
        clearInterval(window.extractionInterval);
        window.extractionInterval = null;
      }
      
      // Reset job info to clear the display
      jobInfo = null;
      
      // Update badge to show it's closed
      updateBadge();
    });
    
    dragHandle.appendChild(closeButton);

    badge.appendChild(dragHandle);

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'badge-content';
    badge.appendChild(contentContainer);

    // Add drag functionality
    setupDragHandling(badge, dragHandle);
    
    // Load saved position
    loadBadgePosition(badge);
    
    // Add copy button event listener
    setTimeout(() => {
      const copyBtn = badge.querySelector('.copy-job-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', copyJobToClipboard);
      }
    }, 100);
  
  return badge;
}

// Update the badge display with accurate counts (excluding badge content)
function updateBadge() {
  let badge = document.getElementById('keyword-highlighter-badge');

  if (!badge) {
    badge = createBadge();
    if (!badge) {
      return; // Job Radar is disabled
    }
  }

  // Recalculate total counts from actual DOM (excluding badge area)
  recalculateCountsFromDOM();

  // Check if we have a valid API key for the current provider
  let hasValidApiKey = false;
  if (aiProvider === 'openai' && selectedOpenaiKey) {
    const key = openaiKeys.find(k => k.id === selectedOpenaiKey);
    hasValidApiKey = key && key.status === 'valid';
  } else if (aiProvider === 'gemini' && selectedGeminiKey) {
    const key = geminiKeys.find(k => k.id === selectedGeminiKey);
    hasValidApiKey = key && key.status === 'valid';
  }

  let content = '';

  // Check if badge is hidden (closed)
  const isBadgeHidden = badge && badge.style.display === 'none';
  
  if (isBadgeHidden) {
    // Show closed state with reopen button
    content += `
      <div class="job-info closed-ui">
        <div class="job-info-title">🔒 Job Radar Closed</div>
        <div style="text-align: center; padding: 12px;">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
            Job extraction is paused<br>
            Keyword highlighting is still active
          </div>
          <button class="reopen-btn" title="Reopen Job Radar" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          ">🔓 Reopen</button>
        </div>
      </div>
    `;
  } else {
  // Add job information if available
    if (jobInfo) {
      // Check location compatibility
      let locationAlert = '';
      if (userLocation && jobInfo.jobType !== 'Remote') {
        locationAlert = `
          <div class="location-alert" style="
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 8px;
            margin-bottom: 8px;
            font-size: 11px;
            color: #92400e;
          ">
            ⚠️ Location Alert: This job requires location presence. You're looking for fully remote roles.
          </div>
        `;
      }
      
      // Match rate display
      let matchRateDisplay = '';
      if (jobInfo.matchRate > 0) {
        matchRateDisplay = `
          <div class="match-rate" style="
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 3px;
            margin-bottom: 8px;
            text-align: center;
          ">
            <div style="font-size: 11px; color:rgb(32, 79, 145); margin-bottom: 4px;">ATS Match Rate - ${jobInfo.matchRate}%</div>
          </div>
        `;
      }
      
        content += `
          <div class="job-info">
          ${locationAlert}
          ${matchRateDisplay}
          <div class="job-info-title">Job Information <span class="job-type-${jobInfo.jobType === 'Remote' ? 'green' : 'red'}"> - ${escapeHtml(jobInfo.jobType || 'No Sure')}</span></div>
            Company: ${escapeHtml(jobInfo.company || '')}<br>
          Position: ${escapeHtml(jobInfo.position || '')}<br>
          Industry: <span style="color: #7c3aed; font-weight: 600;">${escapeHtml(jobInfo.industry || 'Not specified')}</span><br>
          Company Type: <span style="color: #dc2626; font-weight: 600;">${escapeHtml(jobInfo.companyType || 'Not specified')}</span><br>
          Size & Team: <span style="color: ${getCompanySizeColor(jobInfo.companySize)}; font-weight: 600;">${escapeHtml(jobInfo.companySize || 'Unknown')} (${escapeHtml(jobInfo.teamSize || 'Not specified')})</span><br>
          Founded: <span style="color: #7c2d12; font-weight: 600;">${escapeHtml(jobInfo.foundedDate || 'Not specified')}</span>
          ${jobInfo.jobSummary ? `
            <div class="job-summary-section" style="margin-top: 12px; padding: 10px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #3b82f6;">
              <div class="job-summary-title" style="font-weight: 600; color: #1e40af; margin-bottom: 6px; font-size: 13px;">📋 Job Summary:</div>
              <div class="job-summary-content" style="font-size: 12px; line-height: 1.4; color: #374151;">${escapeHtml(jobInfo.jobSummary)}</div>
            </div>
          ` : ''}
          ${jobInfo.skills && jobInfo.skills.length > 0 ? `
            <div class="skills-section">
              <div class="skills-title">🔧 Required Skills:</div>
              <div class="skills-list">
                ${jobInfo.skills.map((skill, index) => `
                  <span class="skill-tag">
                    ${escapeHtml(skill)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
            <!-- Job Info Buttons moved here -->
            <div class="job-info-buttons">
              <button class="copy-job-btn" title="Copy to Google Sheets">📋</button>
              <button class="extract-job-btn" title="Extract Job Information">🔍</button>
            </div>
          </div>
          
          <!-- Cover Letter Generation Section - Only show if profile is complete -->
            <div class="cover-letter-section" style="display: ${coverLetterEnabled ? 'block' : 'none'}">
              <div class="cover-letter-title">✍️ Cover Letter Generator</div>
              <div class="cover-letter-input-container">
                <textarea 
                  class="cover-letter-prompt" 
                  placeholder="Enter your cover letter prompt here... (e.g., 'Write a professional cover letter highlighting my Python and React experience')"
                  rows="3"
                ></textarea>
                <button class="generate-cover-letter-btn" title="Enter a prompt to enable generation" disabled>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>
              
              <!-- Generated Cover Letter Display -->
              <div class="generated-cover-letter" style="display: none;">
                <div class="cover-letter-header">
                  <span>📄 Generated Cover Letter</span>
                  <button class="copy-cover-letter-btn" title="Copy Cover Letter">📋</button>
                </div>
                <div class="cover-letter-content"></div>
              </div>
            </div>
        `;
      } else {
      // Show enhanced loading UI when job info is not available
        content += `
        <div class="job-info loading-ui">
          <div class="job-info-title">🔄 Job Detection Status</div>
          <div class="status-grid">
            <div class="status-item ${isJobSite ? 'success' : 'error'}">
              <span class="status-icon">${isJobSite ? '✅' : '❌'}</span>
              <span class="status-label">Site:</span>
              <span class="status-value">${isJobSite ? 'Job Site' : 'Not Job Site'}</span>
            </div>
            <div class="status-item ${hasValidApiKey ? 'success' : 'error'}">
              <span class="status-icon">${hasValidApiKey ? '✅' : '❌'}</span>
              <span class="status-label">API Key:</span>
              <span class="status-value">${hasValidApiKey ? `${aiProvider === 'openai' ? 'OpenAI' : 'Gemini'} Available` : 'Missing'}</span>
            </div>
            <div class="status-item ${jobInfo ? 'success' : 'pending'}">
              <span class="status-icon">${jobInfo ? '✅' : '⏳'}</span>
              <span class="status-label">Job Info:</span>
              <span class="status-value">${jobInfo ? 'Extracted' : 'Extracting...'}</span>
            </div>
          </div>
          <div class="loading-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min((loadAttempts / maxLoadAttempts) * 100, 100)}%"></div>
              </div>
              <div class="progress-text">${getPageLoadStatus()}</div>
              ${blockedRequests > 0 ? `<div class="blocked-requests">🚫 ${blockedRequests} requests blocked</div>` : ''}
            </div>
            <div class="loading-animation">
              <div class="loading-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
          <div class="button-row">
            <button class="extract-job-btn" title="Extract Job Information">🔍</button>
          </div>
        `;
      }
      }

  const sortedKeywords = Object.entries(matches)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedKeywords.length === 0) {
    content += '<div class="no-matches">✨ No keyword matches found</div>';
  } else {
    sortedKeywords.forEach(([keyword, count]) => {
      const keywordObj = keywords.find(k => k.text === keyword);
      const color = keywordObj ? keywordObj.color : '#667eea';
      // Capitalize first letter of keyword
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      content += `
        <div class="keyword-result">
          <div class="keyword-info">
            <span class="keyword-dot" style="background-color: ${color}"></span>
            <span class="keyword-text">${escapeHtml(capitalizedKeyword)}</span>
          </div>
          <span class="count-badge">${count}</span>
        </div>
      `;
    });
  }

  // Update only the content container, preserve drag handle
  const contentContainer = badge.querySelector('.badge-content');
  if (contentContainer) {
    contentContainer.innerHTML = content;
    
          // Add copy button event listener after content update
      setTimeout(() => {
        const copyBtn = badge.querySelector('.copy-job-btn');
        if (copyBtn) {
          copyBtn.addEventListener('click', copyJobToClipboard);
        }
        
        // Add extract job button event listener
        const extractBtn = badge.querySelector('.extract-job-btn');
        if (extractBtn) {
          extractBtn.addEventListener('click', manualExtractJobInfo);
        }
        
        // Add cover letter generation button event listener
        const generateCoverLetterBtn = badge.querySelector('.generate-cover-letter-btn');
        if (generateCoverLetterBtn) {
          generateCoverLetterBtn.addEventListener('click', generateCoverLetter);
        }
        
        // Add copy cover letter button event listener
        const copyCoverLetterBtn = badge.querySelector('.copy-cover-letter-btn');
        if (copyCoverLetterBtn) {
          copyCoverLetterBtn.addEventListener('click', copyCoverLetter);
        }
        
        // Add cover letter prompt saving event listener
        const coverLetterPrompt = badge.querySelector('.cover-letter-prompt');
        if (coverLetterPrompt) {
          coverLetterPrompt.addEventListener('input', (e) => {
            saveCoverLetterPrompt(e.target.value);
            updateGenerateButtonState(e.target.value);
          });
          
          // Load saved prompt and update button state
          loadCoverLetterPrompt();
        }
        
        // Check profile status and update badge accordingly
        // updateBadgeForProfile();
        
        // Add reopen button event listener
        const reopenBtn = badge.querySelector('.reopen-btn');
        if (reopenBtn) {
          reopenBtn.addEventListener('click', () => {
            // Show the badge
            if (badge) {
              badge.style.display = 'block';
            }
            
            // Restart job extraction
            if (isJobSite) {
              // Check if we have a valid API key for the current provider
              let hasValidApiKey = false;
              if (aiProvider === 'openai' && selectedOpenaiKey) {
                const key = openaiKeys.find(k => k.id === selectedOpenaiKey);
                hasValidApiKey = key && key.status === 'valid';
              } else if (aiProvider === 'gemini' && selectedGeminiKey) {
                const key = geminiKeys.find(k => k.id === selectedGeminiKey);
                hasValidApiKey = key && key.status === 'valid';
              }
              
              if (hasValidApiKey) {
              startContinuousJobExtraction();
              }
            }
            
            // Update badge to show active state
            updateBadge();
          });
        }
        
        // Add click handler to badge content for retry when failed
        const badgeContent = badge.querySelector('.badge-content');
        if (badgeContent && (loadFailed || loadAttempts >= 8)) {
          badgeContent.style.cursor = 'pointer';
          badgeContent.title = 'Click to retry extraction';
          badgeContent.addEventListener('click', (e) => {
            // Don't trigger if clicking on buttons
            if (!e.target.closest('button')) {
              manualExtractJobInfo();
            }
          });
        }
      }, 100);
  }
}

// Setup drag handling for the badge
function setupDragHandling(badge, dragHandle) {
  dragHandle.addEventListener('mousedown', startDrag);

  function startDrag(e) {
    isDragging = true;

    const rect = badge.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    e.preventDefault();
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);

    badge.style.zIndex = '10001';
    badge.style.transition = 'none';
  }

  function handleDrag(e) {
    if (!isDragging) return;

    const newLeft = e.clientX - dragOffset.x;
    const newTop = e.clientY - dragOffset.y;
    
    // Keep badge within viewport bounds
    const maxLeft = window.innerWidth - badge.offsetWidth;
    const maxTop = window.innerHeight - badge.offsetHeight;
    
    const boundedLeft = Math.max(0, Math.min(newLeft, maxLeft));
    const boundedTop = Math.max(0, Math.min(newTop, maxTop));
    
    badge.style.left = boundedLeft + 'px';
    badge.style.top = boundedTop + 'px';
  }

  function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    badge.style.transition = 'all 0.3s ease';
    badge.style.zIndex = '10000';

    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);

    // Save position
      const position = {
        left: badge.style.left,
        top: badge.style.top
      };
    chrome.storage.sync.set({ badgePosition: position });
  }
}

// Main highlighting function
function highlightKeywords() {
  
  if (isProcessing || keywords.length === 0) {
    console.log('Skipping highlighting:', { isProcessing, keywordsCount: keywords.length });
    return;
  }
  
  isProcessing = true;
  
  // Reset matches
  matches = {};
  keywords.forEach(keywordObj => {
    matches[keywordObj.text] = 0;
  });


  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (isInsideBadge(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        if (node.parentElement && (
          node.parentElement.tagName === 'SCRIPT' ||
          node.parentElement.tagName === 'STYLE' ||
          node.parentElement.tagName === 'NOSCRIPT' ||
          node.parentElement.classList.contains('keyword-highlight')
        )) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim().length > 0) {
      textNodes.push(node);
    }
  }
  

  textNodes.forEach(textNode => {
    if (processedElements.has(textNode) || isInsideBadge(textNode)) return;
    
    let text = textNode.textContent;
    let hasMatches = false;
    
    keywords.forEach(keywordObj => {
      const regex = new RegExp(`\\b${escapeRegExp(keywordObj.text)}\\b`, 'gi');
      if (regex.test(text)) {
        hasMatches = true;
      }
    });
    
    if (hasMatches) {
      let newHTML = text;
      
      keywords.forEach(keywordObj => {
        const regex = new RegExp(`\\b(${escapeRegExp(keywordObj.text)})\\b`, 'gi');
        newHTML = newHTML.replace(regex, (match) => {
          matches[keywordObj.text] = (matches[keywordObj.text] || 0) + 1;
          return `<span class="keyword-highlight" style="--highlight-color: ${keywordObj.color}">${match}</span>`;
        });
      });
      
      if (newHTML !== text) {
        const wrapper = document.createElement('span');
        wrapper.className = 'keyword-highlight-container';
        wrapper.innerHTML = newHTML;
        
        textNode.parentNode.replaceChild(wrapper, textNode);
        processedElements.add(wrapper);
      }
    }
  });
  

  updateBadge();
  isProcessing = false;
}

// Add styles for the badge
const badgeStyle = document.createElement('style');
badgeStyle.textContent = `
  #keyword-highlighter-badge {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    color: #2d3748;
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease, height 0.4s ease;
    animation: badgeSlideIn 0.5s ease-out;
    will-change: transform, height;
    z-index: 10000;
    width: 320px;
    height: auto;
    min-height: 200px;
    user-select: none;
    box-sizing: border-box;
    overflow: hidden;
  }
  
  #keyword-highlighter-badge:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  @keyframes badgeSlideIn {
    from {
      opacity: 0;
      transform: translateX(100%) scale(0.8);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
  
  .badge-content {
    padding: 6px;
    height: auto;
    min-height: 150px;
    max-height: none;
    overflow-y: visible;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    flex-shrink: 0;
  }
  
  .badge-content::-webkit-scrollbar {
    width: 4px;
  }
  
  .badge-content::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 2px;
  }
  
  .badge-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }
  
  .badge-content::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  .keyword-result {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    padding-right: 3px;
    padding-left: 3px;
    background: #f8fafc;
    border-radius: 8px;
    transition: all 0.3s ease;
    border: 1px solid #e2e8f0;
    height: 28px;
    flex-shrink: 0;
  }
  
  .keyword-result:last-child {
    margin-bottom: 0;
  }
  
  .keyword-info {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }
  
  .keyword-dot {
    width: 8px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .keyword-text {
    flex: 1;
    font-weight: 500;
    color: #2d3748;
    font-size: 13px;
  }
  
  .count-badge {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
    min-width: 24px;
    text-align: center;
    flex-shrink: 0;
    white-space: nowrap;
  }
  
  .no-matches {
    color: #a0aec0;
    font-style: italic;
    text-align: center;
    padding: 16px 12px;
    font-size: 13px;
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  
  .badge-drag-handle {
    cursor: pointer;
    padding: 10px 10px;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px 16px 0 0;
    user-select: none;
    color: white;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    font-weight: 600;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  
  .drag-icon {
    font-size: 12px;
    opacity: 0.8;
    line-height: 1;
  }
  
  .drag-text {
    font-size: 8px;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }
  
  .badge-drag-handle::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s ease;
  }
  
  .badge-drag-handle:hover::before {
    left: 100%;
  }
  
  .badge-drag-handle:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    transform: translateY(-1px);
  }
  
  .badge-drag-handle:active {
    transform: scale(0.98);
  }
  
  .badge-drag-handle:hover .drag-text {
    opacity: 1;
  }
  
  .job-info {
    border-radius: 8px;
    color: black;
    padding: 5px;
    margin-bottom: 6px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    height: auto;
    min-height: 80px;
    max-height: none;
    display: block;
    box-sizing: border-box;
    overflow: visible;
    line-height: 1.6;
  }
  
  .job-info-title {
    font-weight: 600;
    color:rgb(29, 88, 190);
    font-size: 12px;
    margin-top: 8px;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .job-type-red {
    color: #dc2626;
    font-weight: 700;
  }
  
  .job-type-green {
    color: #059669;
    font-weight: 700;
  }
  
  
  .extract-job-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  
  .extract-job-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
  
  .extract-job-btn:active {
    transform: scale(0.95);
  }
  
  .job-info.loading-ui {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border: 1px solid #cbd5e1;
    color: #334155;
    height: auto;
    min-height: 120px;
    max-height: none;
    display: block;
    box-sizing: border-box;
    overflow: visible;
    line-height: 1.6;
    padding: 12px;
    margin-bottom: 6px;
    border-radius: 12px;
  }
  
  .status-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 12px 0;
  }
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .status-item.success {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.1);
  }
  
  .status-item.error {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
  
  .status-item.pending {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }
  
  .status-icon {
    font-size: 14px;
    min-width: 20px;
  }
  
  .status-label {
    font-weight: 600;
    color: #475569;
    min-width: 70px;
  }
  
  .status-value {
    font-weight: 500;
    color: #1e293b;
  }
  
  .loading-progress {
    margin: 16px 0;
  }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 4px;
    transition: width 0.3s ease;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  }
  
  .progress-text {
    text-align: center;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }
  
  .blocked-requests {
    text-align: center;
    font-size: 11px;
    color: #ef4444;
    font-weight: 600;
    margin-top: 4px;
    padding: 4px 8px;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 6px;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
  
  .loading-animation {
    display: flex;
    justify-content: center;
    margin-top: 12px;
  }
  
  .loading-dots {
    display: flex;
    gap: 4px;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #3b82f6;
    animation: loadingPulse 1.4s ease-in-out infinite both;
  }
  
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  .dot:nth-child(3) { animation-delay: 0s; }
  
  @keyframes loadingPulse {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  @keyframes progressPulse {
    0%, 100% {
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }
    50% {
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.6);
    }
  }
  
  .job-info.debug {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    height: auto;
    min-height: 80px;
    max-height: none;
    display: block;
    box-sizing: border-box;
    overflow: visible;
    line-height: 1.6;
    padding: 5px;
    margin-bottom: 6px;
  }
  
  .button-row {
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    margin-top: 8px;
    margin-bottom: 8px;
  }
  
  .copy-job-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }
  
  .copy-job-btn:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .copy-job-btn:active {
    transform: scale(0.95);
  }
  
  .skills-section {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e2e8f0;
  }
  
  .skills-title {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }
  
  .skill-tag {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    color: white !important;
    padding: 3px 8px !important;
    border-radius: 12px !important;
    font-size: 10px !important;
    font-weight: 500 !important;
    display: inline-block !important;
    box-shadow: 0 1px 3px rgba(102, 126, 234, 0.3) !important;
    transition: all 0.2s ease !important;
  }
  
  .skill-tag:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4) !important;
  }
  
  /* Cover Letter Generation Styles */
  .cover-letter-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    opacity: 1;
    transition: opacity 0.3s ease-in-out;
  }
  
  .cover-letter-section.loading {
    opacity: 0.7;
  }
  
  .cover-letter-title {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .cover-letter-input-container {
    position: relative;
    width: 100%;
  }
  
  .cover-letter-prompt {
    width: 100%;
    padding: 8px 40px 8px 8px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 11px;
    font-family: inherit;
    resize: vertical;
    min-height: 60px;
    background: #f9fafb;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }
  
  .cover-letter-prompt:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  .generate-cover-letter-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  
  .generate-cover-letter-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .generate-cover-letter-btn:active {
    transform: scale(0.95);
  }
  
  .generate-cover-letter-btn svg {
    width: 14px;
    height: 14px;
  }
  
  /* Disabled button state */
  .generate-cover-letter-btn.disabled {
    background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%) !important;
    cursor: not-allowed !important;
    opacity: 0.6;
  }
  
  .generate-cover-letter-btn.disabled:hover {
    transform: none !important;
    box-shadow: none !important;
  }
  
  .generated-cover-letter {
    margin-top: 12px;
    padding: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }
  
  .cover-letter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: #374151;
  }
  
  .copy-cover-letter-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .copy-cover-letter-btn:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    transform: scale(1.05);
  }
  
  .cover-letter-content {
    font-size: 11px;
    line-height: 1.5;
    color: #374151;
    background: white;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #e1e5e9;
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
  }
  
  /* Job Info Buttons Styles */
  .job-info-buttons {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
    justify-content: center;
  }
  
  .job-info-buttons .copy-job-btn,
  .job-info-buttons .extract-job-btn {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
  }
  
  .job-info-buttons .copy-job-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .job-info-buttons .extract-job-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }
  
  .job-info-buttons .copy-job-btn:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    transform: scale(1.05);
  }
  
  .job-info-buttons .extract-job-btn:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: scale(1.05);
  }
`;
document.head.appendChild(badgeStyle);

// Handle page unloading
window.addEventListener('beforeunload', () => {
  if (observer) {
    observer.disconnect();
  }
  isProcessing = false;
});

// Collect job information by flexible element detection
function collectJobElements() { 
  // Temporarily hide the badge to exclude it from content collection
  const badge = document.getElementById('keyword-highlighter-badge');
  let badgeWasHidden = false;
  
  if (badge) {
    badgeWasHidden = badge.style.display === 'none';
    badge.style.display = 'none';
  }
  
  // Get the body content without the badge
  const content = cleanHtmlContent(document.body.outerHTML);
  
  // Restore badge visibility if it was visible before
  if (badge && !badgeWasHidden) {
    badge.style.display = 'block';
  }
  
  return content;
}

// Initial styles
const initialStyles = document.createElement('style');
initialStyles.textContent = `
  .keyword-highlight {
    background-color: var(--highlight-color, #FFEB3B) !important;
    color: #000 !important;
    padding: 0 2px !important;
    border-radius: 3px !important;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
  }
  
  .keyword-highlight-container {
    display: inline;
  }
`;
document.head.appendChild(initialStyles);

// Hotkey: ALT+X to toggle Job Radar (and badge) globally
window.addEventListener('keydown', (e) => {
  try {
    if (!e.altKey) return;
    const key = e.key || '';
    if (key.toLowerCase() !== 'x') return;

    // Avoid triggering while typing in inputs/textareas/contentEditable
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) {
      return;
    }

    // Only act on job sites
    if (!isJobSite) return;

    // Flip global Job Radar enabled state and broadcast
    const newEnabled = !jobRadarEnabled;
    chrome.storage.sync.set({ jobRadarEnabled: newEnabled }, () => {
      chrome.runtime.sendMessage({
        action: 'updateJobRadarState',
        enabled: newEnabled
      }).catch(() => {});
    });

    // Locally apply the same effect immediately
    jobRadarEnabled = newEnabled;
    if (jobRadarEnabled) {
      let existing = document.getElementById('keyword-highlighter-badge');
      if (!existing) {
        existing = createBadge();
      }
      if (existing) {
        existing.style.display = 'block';
        updateBadge();
      }
    } else {
      const existing = document.getElementById('keyword-highlighter-badge');
      if (existing) {
        existing.style.display = 'none';
      }
    }
  } catch (_) {
  }
});
