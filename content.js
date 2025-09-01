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
let openaiApiKey = null;
let loadAttempts = 0;
let maxLoadAttempts = 3;
let loadFailed = false;
let lastLoadError = null;
let isRequestInProgress = false; // Prevent multiple simultaneous requests
let blockedRequests = 0; // Track blocked requests
let jobRadarEnabled = true; // Default to enabled

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
chrome.storage.sync.get(['keywords', 'badgePosition', 'openaiApiKey'], (result) => {

  if (result.keywords && result.keywords.length > 0) {
    keywords = result.keywords;
  } else {
    // Set default keywords if none exist
    keywords = defaultKeywords;
    chrome.storage.sync.set({ keywords: defaultKeywords });
  }

  // Load saved API key
  if (result.openaiApiKey) {
    openaiApiKey = result.openaiApiKey;
  }

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
  if (namespace === 'sync' && changes.keywords) {
    keywords = changes.keywords.newValue || [];
    removeHighlights();
    processedElements = new WeakSet();
    initializeHighlighter();
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
  } else if (request.action === 'updateApiKey') {
    // Update API key from popup
    openaiApiKey = request.apiKey;
    
    // If this is a job site and we now have an API key, try to extract job info
    if (isJobSite && openaiApiKey) {
      setTimeout(extractJobInfo, 1000);
    }
  } else if (request.action === 'updateJobRadarState') {
    jobRadarEnabled = request.enabled;
    
    if (jobRadarEnabled) {
      // Enable Job Radar - create badge if it doesn't exist
      if (!badge) {
        createBadge();
      }
      if (badge) {
        badge.style.display = 'block';
      }
    } else {
      // Disable Job Radar - hide badge
      if (badge) {
        badge.style.display = 'none';
      }
    }
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
    
    if (!openaiApiKey) {
      alert('Please configure your OpenAI API key in the extension popup first.');
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

  // Start continuous job extraction every 4 seconds for up to 30 seconds
  function startContinuousJobExtraction() {
    
    let attempts = 0;
    const maxAttempts = 8; // 30 seconds / 4 seconds = 7.5, so 8 attempts
    const interval = 4000; // 4 seconds
    
    // Clear any existing interval to prevent multiple intervals
    if (window.extractionInterval) {
      clearInterval(window.extractionInterval);
    }
    
    const extractionInterval = setInterval(() => {
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
  }, interval);
  
  // Also try immediate extraction
  setTimeout(() => {
    extractJobInfo();
  }, 1000);
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

// Extract job information using GPT-4 Turbo
async function extractJobInfo() {
  if (!isJobSite || !openaiApiKey) {
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
  console.log(`🔒 Starting job extraction attempt ${loadAttempts + 1}/${maxLoadAttempts}`);
  
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
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
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

"jobType": Work arrangement - Look for job-specific work arrangement indicators. Use "Remote" if job has "Remote" tags/badges or explicitly states remote work for this position, "Hybrid" if job mentions hybrid requirements for this position, "On-site" if job requires office presence for this position, or "" if unclear. CRITICAL: If job posting shows "Remote" tags/badges, classify as "Remote" regardless of any general company workplace policies mentioned elsewhere.

"industry": Industry classification - Analyze the FULL CONTENT to determine the company's industry. Look for industry-specific keywords, company descriptions, product/service mentions, and business context. Examples: Healthcare, Fintech, E-commerce, SaaS, Manufacturing, Education, Retail, etc. Return the most specific industry category, or "" if unclear.

"skills": Top 5 required skills or tech stack - Analyze the FULL CONTENT to identify the most important technical skills, programming languages, frameworks, tools, or technologies required for this position. Look for skills mentioned in job requirements, qualifications, "what you'll need" sections, and technical specifications. Return as an array of exactly 5 skills, or fewer if less than 5 are clearly specified. Examples: ["JavaScript", "React", "Node.js", "MongoDB", "AWS"] or ["Python", "Machine Learning", "TensorFlow", "SQL", "Git"]. If no specific skills found, return empty array [].

The HTML structure will help you identify the main job title and company name more accurately.

SEMANTIC ANALYSIS: For job type detection, analyze the FULL CONTENT semantically. Look for work arrangement patterns, location requirements, flexibility mentions, and company policies. Pay special attention to physical presence requirements: commute, relocate, in-office meetings, travel requirements, and whether the job allows work from anywhere or requires specific location presence.

CRITICAL: Return ONLY a valid JSON object. Do not include any other text, explanations, or markdown formatting. The response must start with { and end with }. If any field is missing, use empty string "".`
        }, {
          role: 'user',
          content: pageContent
        }],
        max_tokens: 1000,
        temperature: 0.1
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // Clear timeout if successful
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;

      
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
            skills: Array.isArray(jobData.skills) ? jobData.skills : []
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
  
  // Only show badge and extract job info if it's a job site AND Job Radar is enabled
  if (isJobSite && jobRadarEnabled) {
    
    // Extract job information if we have an API key
    if (openaiApiKey) {
      startContinuousJobExtraction();
    } else {
    }
    
    // Show the badge
    updateBadge();
    
    // Initial highlight for existing content
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(highlightKeywords, 1000);
      });
    } else {
      setTimeout(highlightKeywords, 1000);
    }
    
    // Start continuous keyword monitoring
    startContinuousKeywordMonitoring();
  } else {
    
    // Hide/remove the badge if it exists
    const existingBadge = document.getElementById('keyword-highlighter-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
    
    // Don't start job extraction or keyword monitoring
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
  
  if (!jobInfo || !jobInfo.position || !jobInfo.company) {
    showCopyError('No job info available');
    return;
  }
  
  try {
    // Get current job URL
    const jobUrl = window.location.href;
    
    // Clean the data to prevent issues with tabs/newlines
    const cleanCompany = jobInfo.company.replace(/[\t\n\r]/g, ' ').trim();
    const cleanPosition = jobInfo.position.replace(/[\t\n\r]/g, ' ').trim();
    
    // Create tab-separated string: Company\tPosition\tURL
    const copyText = `${cleanCompany}\t${cleanPosition}\t${jobUrl}`;
    
    
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
      padding: 4px 10px;
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
      content += `
        <div class="job-info">
          <div class="job-info-title">Job Information <span class="job-type-${jobInfo.jobType === 'Remote' ? 'green' : 'red'}"> - ${escapeHtml(jobInfo.jobType || 'No Sure')}</span></div>
          Company: ${escapeHtml(jobInfo.company || '')}<br>
          Position: ${escapeHtml(jobInfo.position || '')}<br>
          Industry: <span style="color: #7c3aed; font-weight: 600;">${escapeHtml(jobInfo.industry || 'Not specified')}</span>
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
        </div>
        <div class="button-row">
          <button class="copy-job-btn" title="Copy to Google Sheets">📋</button>
          <button class="extract-job-btn" title="Extract Job Information">🔍</button>
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
            <div class="status-item ${openaiApiKey ? 'success' : 'error'}">
              <span class="status-icon">${openaiApiKey ? '✅' : '❌'}</span>
              <span class="status-label">API Key:</span>
              <span class="status-value">${openaiApiKey ? 'Available' : 'Missing'}</span>
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
        
        // Add reopen button event listener
        const reopenBtn = badge.querySelector('.reopen-btn');
        if (reopenBtn) {
          reopenBtn.addEventListener('click', () => {
            // Show the badge
            if (badge) {
              badge.style.display = 'block';
            }
            
            // Restart job extraction
            if (isJobSite && openaiApiKey) {
              startContinuousJobExtraction();
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
    max-height: 600px;
    user-select: none;
    box-sizing: border-box;
    overflow: visible;
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
