// localStorage Storage Manager for API keys
class ApiKeyStorageManager {
  constructor() {
    this.openaiKeysKey = 'jobRadarOpenaiKeys';
    this.geminiKeysKey = 'jobRadarGeminiKeys';
  }

  async init() {
    // localStorage doesn't need initialization
    return Promise.resolve();
  }

  async saveApiKeys(provider, keys) {
    try {
      const key = provider === 'openai' ? this.openaiKeysKey : this.geminiKeysKey;
      localStorage.setItem(key, JSON.stringify(keys));
      console.log(`✅ Saved ${keys.length} ${provider} keys to localStorage`);
    } catch (error) {
      console.error(`❌ Failed to save ${provider} keys to localStorage:`, error);
      throw error;
    }
  }

  async loadApiKeys(provider) {
    try {
      const key = provider === 'openai' ? this.openaiKeysKey : this.geminiKeysKey;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`❌ Failed to load ${provider} keys from localStorage:`, error);
      return [];
    }
  }
}

// Initialize storage manager
const apiKeyStorage = new ApiKeyStorageManager();

// Handle opening URLs in background to keep running after popup closes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Relay Job Radar state changes to all tabs so every page updates instantly
  if (message && message.action === 'updateJobRadarState' && typeof message.enabled === 'boolean') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateJobRadarState',
            enabled: message.enabled
          }).catch(() => { });
        }
      });
    });
    try { sendResponse({ status: 'broadcasted' }); } catch (_) { }
    return true;
  }

  // Handle API key saving from popup
  if (message && message.action === 'saveApiKeys') {
    (async () => {
      try {
        const { openaiKeys, geminiKeys } = message;

        console.log('🔄 Background: Saving API keys from popup...');

        // Save to Chrome storage (background scripts can't access localStorage)
        const storageData = {};
        if (openaiKeys && openaiKeys.length > 0) {
          storageData.openaiKeys = openaiKeys;
          console.log(`✅ Background: Prepared ${openaiKeys.length} OpenAI keys for Chrome storage`);
        }
        if (geminiKeys && geminiKeys.length > 0) {
          storageData.geminiKeys = geminiKeys;
          console.log(`✅ Background: Prepared ${geminiKeys.length} Gemini keys for Chrome storage`);
        }

        // Save to Chrome local storage
        await new Promise((resolve, reject) => {
          chrome.storage.local.set(storageData, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });

        console.log('✅ Background: API keys saved to Chrome storage successfully');
        sendResponse({ success: true });
      } catch (error) {
        console.error('❌ Background: Failed to save API keys:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message && message.action === 'saveApiKeysToStorage') {
    (async () => {
      const { provider, keys } = message;

      console.log(`🔄 Background: Saving ${keys.length} ${provider} keys to IndexedDB...`);

      try {
        // Get existing keys from IndexedDB (primary storage)
        const existingKeys = await apiKeyStorage.loadApiKeys(provider);
        console.log(`📥 Background: Loaded ${existingKeys.length} existing ${provider} keys from IndexedDB`);

        // Merge with new keys (avoid duplicates)
        const allKeys = [...existingKeys];
        let duplicatesFound = 0;
        for (const newKey of keys) {
          const isDuplicate = allKeys.some(existingKey => existingKey.key === newKey.key);
          if (!isDuplicate) {
            allKeys.push(newKey);
          } else {
            duplicatesFound++;
          }
        }

        console.log(`🔗 Background: Merged keys - ${allKeys.length} total, ${allKeys.length - existingKeys.length} new, ${duplicatesFound} duplicates skipped`);

        // Save to IndexedDB (primary storage for large numbers)
        try {
          await apiKeyStorage.saveApiKeys(provider, allKeys);
          console.log(`✅ Background: Successfully saved ${allKeys.length} ${provider} keys to IndexedDB`);
        } catch (storageError) {
          console.error(`❌ Background: Failed to save ${provider} keys to IndexedDB:`, storageError);
          throw new Error(`Storage failed: ${storageError.message}`);
        }

        try {
          sendResponse({
            status: 'success',
            totalKeys: allKeys.length,
            newKeys: allKeys.length - existingKeys.length
          });
        } catch (_) { }

      } catch (error) {
        console.error('Failed to save API keys to storage:', error);
        try {
          sendResponse({ status: 'error', error: error.message });
        } catch (_) { }
      }
    })();
    return true;
  }

  // Migration handler removed - pure IndexedDB system doesn't need migration

  if (message && message.action === 'processApiKeysInBackground') {
    (async () => {
      const { provider, apiKeys, progressCallback } = message;

      try {
        console.log(`🔄 Background processing ${apiKeys.length} ${provider} API keys`);

        const results = {
          valid: [],
          invalid: [],
          errors: []
        };

        // Process keys in batches to avoid overwhelming the system
        const batchSize = 5;
        for (let i = 0; i < apiKeys.length; i += batchSize) {
          const batch = apiKeys.slice(i, i + batchSize);

          // Process batch in parallel
          const batchPromises = batch.map(async (apiKey, batchIndex) => {
            const globalIndex = i + batchIndex;
            try {
              const isValid = await testApiKeyInBackground(provider, apiKey);
              if (isValid) {
                results.valid.push(apiKey);
              } else {
                results.invalid.push(apiKey);
              }

              // Send progress update
              if (progressCallback) {
                chrome.runtime.sendMessage({
                  action: 'apiKeyProgress',
                  progress: Math.round(((globalIndex + 1) / apiKeys.length) * 100),
                  current: globalIndex + 1,
                  total: apiKeys.length,
                  valid: results.valid.length,
                  invalid: results.invalid.length
                }).catch(() => { });
              }

              // Small delay between API calls to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));

            } catch (error) {
              console.error(`Error testing API key ${globalIndex + 1}:`, error);
              results.errors.push({ key: apiKey, error: error.message });
            }
          });

          await Promise.all(batchPromises);

          // Longer delay between batches
          if (i + batchSize < apiKeys.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        console.log(`✅ Background processing complete: ${results.valid.length} valid, ${results.invalid.length} invalid, ${results.errors.length} errors`);

        try {
          sendResponse({
            status: 'complete',
            results,
            summary: {
              total: apiKeys.length,
              valid: results.valid.length,
              invalid: results.invalid.length,
              errors: results.errors.length
            }
          });
        } catch (_) { }

      } catch (error) {
        console.error('Background API key processing failed:', error);
        try {
          sendResponse({ status: 'error', error: error.message });
        } catch (_) { }
      }
    })();
    return true;
  }

  // ---- Auto-check background runner ----
  if (message && message.action === 'startAutoCheck') {
    (async () => {
      try {
        const { sheetUrl } = message;
        autoCheckRunning = true;
        await runAutoCheck(sheetUrl, sendResponse);
      } catch (e) {
        console.error('Auto-check start failed:', e);
        try { sendResponse({ ok: false, error: String(e) }); } catch (_) { }
      }
    })();
    return true;
  }

  if (message && message.action === 'stopAutoCheck') {
    autoCheckRunning = false;
    // Cleanup any remaining tabs
    cleanupActiveTabs().catch(console.error);
    try { sendResponse({ ok: true }); } catch (_) { }
    return true;
  }

  if (message && message.action === 'getAutoCheckStatus') {
    try { sendResponse({ running: !!autoCheckRunning }); } catch (_) { }
    return true;
  }

  if (message && message.action === 'openUrlsInBackground' && Array.isArray(message.urls)) {
    (async () => {
      const urls = message.urls;

      // Get AI settings and API keys for RPM calculation
      const aiSettings = await chrome.storage.sync.get(['aiProvider']);
      const aiProvider = aiSettings.aiProvider || 'openai';

      // Load API keys from IndexedDB
      const [openaiKeys, geminiKeys] = await Promise.all([
        apiKeyStorage.loadApiKeys('openai'),
        apiKeyStorage.loadApiKeys('gemini')
      ]);

      // Pre-assign API keys to URLs using urlNumber % numberOfApiKeys
      const urlKeyAssignments = preAssignKeysToUrls(aiProvider, openaiKeys, geminiKeys, urls);

      // Calculate RPM-aware opening strategy
      const openingStrategy = calculateRpmAwareOpeningStrategy(aiProvider, openaiKeys, geminiKeys, urls.length);

      console.log(`🚀 RPM-Aware URL Opening Strategy:`, openingStrategy);
      console.log(`🔑 URL-Key Pre-Assignments:`, urlKeyAssignments);

      // Store URL-key assignments for content scripts to use
      await storeUrlKeyAssignments(urlKeyAssignments);

      // Notify all content scripts about new URL-key assignments
      try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.url && (tab.url.includes('linkedin.com') || tab.url.includes('indeed.com') || tab.url.includes('glassdoor.com'))) {
            try {
              await chrome.tabs.sendMessage(tab.id, {
                action: 'urlKeyAssignmentsUpdated',
                assignments: urlKeyAssignments
              });
            } catch (error) {
              // Tab might not have content script loaded yet, ignore
            }
          }
        }
        console.log(`📢 Notified content scripts about new URL-key assignments`);
      } catch (error) {
        console.error('Failed to notify content scripts:', error);
      }

      let openedCount = 0;
      let batchNumber = 1;

      for (let i = 0; i < urls.length; i += openingStrategy.batchSize) {
        const batchUrls = urls.slice(i, i + openingStrategy.batchSize);
        const batchStartIndex = i + 1;
        const batchEndIndex = Math.min(i + openingStrategy.batchSize, urls.length);

        console.log(`📦 Batch ${batchNumber}: Opening URLs ${batchStartIndex}-${batchEndIndex} (${batchUrls.length} URLs)`);

        // Open all URLs in current batch simultaneously
        const batchPromises = batchUrls.map(async (url, batchIndex) => {
          const globalIndex = i + batchIndex;
          const assignment = urlKeyAssignments[globalIndex];
          try {
            await chrome.tabs.create({ url, active: false });
            openedCount++;
            console.log(`✅ Opened URL ${globalIndex + 1}/${urls.length}: ${url} → Key: ${assignment.keyId}`);
          } catch (error) {
            console.error(`❌ Failed to open URL ${globalIndex + 1}:`, error);
          }
        });

        await Promise.all(batchPromises);

        // Wait between batches (except after the last batch)
        if (i + openingStrategy.batchSize < urls.length) {
          console.log(`⏳ Waiting ${openingStrategy.batchDelay}ms before next batch (${openingStrategy.batchDelay / 1000}s)`);
          await new Promise(resolve => setTimeout(resolve, openingStrategy.batchDelay));
          batchNumber++;
        }
      }

      console.log(`✅ Finished opening ${openedCount}/${urls.length} URLs with RPM-aware strategy`);

      try {
        sendResponse({
          status: 'done',
          opened: openedCount,
          total: urls.length,
          strategy: openingStrategy
        });
      } catch (_) {
        // noop if response port is closed
      }
    })();
    // Indicate we will respond asynchronously
    return true;
  }
});

let autoCheckRunning = false;

function updateActionBadge(text, color, title) {
  try { chrome.action.setBadgeText({ text: String(text || '') }); } catch (_) { }
  try { if (color) chrome.action.setBadgeBackgroundColor({ color }); } catch (_) { }
  try { if (title) chrome.action.setTitle({ title }); } catch (_) { }
}

async function loadValidKeysForProvider(provider) {
  const result = await new Promise((resolve, reject) => {
    chrome.storage.local.get(['openaiKeys', 'geminiKeys'], (res) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve(res);
    });
  });
  if (provider === 'openai') {
    return (result.openaiKeys || []).filter(k => k.status === 'valid');
  }
  return (result.geminiKeys || []).filter(k => k.status === 'valid');
}

async function getNextAvailableKey(validKeys, currentKeyId = null) {
  if (validKeys.length === 0) return null;
  
  // If no current key or current key not found, return first available
  if (!currentKeyId) {
    return validKeys[0];
  }
  
  const currentIndex = validKeys.findIndex(k => k.id === currentKeyId);
  if (currentIndex === -1) {
    return validKeys[0];
  }
  
  // Return next key in rotation, wrapping to start if needed
  const nextIndex = (currentIndex + 1) % validKeys.length;
  return validKeys[nextIndex];
}

async function markKeyAsRateLimited(keyId, provider) {
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['openaiKeys', 'geminiKeys'], (res) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve(res);
      });
    });
    
    const keyArray = provider === 'openai' ? 'openaiKeys' : 'geminiKeys';
    const keys = result[keyArray] || [];
    const keyIndex = keys.findIndex(k => k.id === keyId);
    
    if (keyIndex >= 0) {
      keys[keyIndex] = { ...keys[keyIndex], isRateLimited: true, rateLimitReset: Date.now() + 10000 }; // 30 min
      await chrome.storage.local.set({ [keyArray]: keys });
      console.log(`🔒 Marked ${provider} key ${keys[keyIndex].masked} as rate limited for 30 minutes`);
    }
  } catch (error) {
    console.error('Failed to mark key as rate limited:', error);
  }
}

async function resetRateLimitedKeys() {
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get(['openaiKeys', 'geminiKeys'], (res) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError); else resolve(res);
      });
    });
    
    const now = Date.now();
    let updated = false;
    
    for (const provider of ['openai', 'gemini']) {
      const keyArray = provider + 'Keys';
      const keys = result[keyArray] || [];
      const updatedKeys = keys.map(key => {
        if (key.isRateLimited && key.rateLimitReset && now > key.rateLimitReset) {
          const { isRateLimited, rateLimitReset, ...rest } = key;
          updated = true;
          console.log(`🔄 Reset rate limit for ${provider} key ${key.masked}`);
          return rest;
        }
        return key;
      });
      
      if (updated) {
        await chrome.storage.local.set({ [keyArray]: updatedKeys });
      }
    }
  } catch (error) {
    console.error('Failed to reset rate limited keys:', error);
  }
}

function normalizeJobUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  try {
    const urlObj = new URL(url);
    
    // Greenhouse confirmation URLs -> job posting URLs
    if (urlObj.hostname === 'job-boards.greenhouse.io' && urlObj.pathname.includes('/confirmation')) {
      // Remove /confirmation and everything after it
      const jobPath = urlObj.pathname.replace(/\/confirmation.*$/, '');
      return `https://job-boards.greenhouse.io${jobPath}`;
    }
    
    // Lever thanks URLs -> job posting URLs
    if (urlObj.hostname === 'jobs.lever.co' && urlObj.pathname.includes('/thanks')) {
      // Remove /thanks and everything after it
      const jobPath = urlObj.pathname.replace(/\/thanks.*$/, '');
      return `https://jobs.lever.co${jobPath}`;
    }
    
    // Lever application URLs -> job posting URLs
    if (urlObj.hostname === 'jobs.lever.co' && urlObj.pathname.includes('/apply')) {
      // Remove /apply and everything after it (including query parameters)
      const jobPath = urlObj.pathname.replace(/\/apply.*$/, '');
      return `https://jobs.lever.co${jobPath}`;
    }
    
    // Workable application URLs -> job posting URLs
    if (urlObj.hostname === 'apply.workable.com' && urlObj.pathname.includes('/apply/')) {
      // Remove /apply/ and everything after it, then add trailing slash
      const jobPath = urlObj.pathname.replace(/\/apply\/.*$/, '/');
      return `https://apply.workable.com${jobPath}`;
    }
    
    // Ashby application URLs -> job posting URLs
    if (urlObj.hostname === 'jobs.ashbyhq.com' && urlObj.pathname.includes('/application')) {
      // Remove /application and everything after it
      const jobPath = urlObj.pathname.replace(/\/application.*$/, '');
      return `https://jobs.ashbyhq.com${jobPath}`;
    }
    
    // Generic pattern for /apply/xxxxx -> remove /apply/ and everything after
    if (urlObj.pathname.includes('/apply/')) {
      const jobPath = urlObj.pathname.replace(/\/apply\/.*$/, '');
      return `${urlObj.protocol}//${urlObj.hostname}${jobPath}`;
    }
    
    // Generic pattern for /thanks/xxxxx -> remove /thanks/ and everything after
    if (urlObj.pathname.includes('/thanks/')) {
      const jobPath = urlObj.pathname.replace(/\/thanks\/.*$/, '');
      return `${urlObj.protocol}//${urlObj.hostname}${jobPath}`;
    }
    
    // Return original URL if no normalization needed
    return url;
  } catch (error) {
    console.warn('Failed to normalize URL:', url, error);
    return url;
  }
}

function isSecurityChallengePage(tab) {
  if (!tab || !tab.url) return false;
  
  const url = tab.url.toLowerCase();
  const title = (tab.title || '').toLowerCase();
  
  // Check for common security challenge indicators
  const securityIndicators = [
    'cloudflare',
    'verifying you are human',
    'security check',
    'please wait while we check your browser',
    'ddos protection',
    'captcha',
    'human verification',
    'access denied',
    'blocked',
    'challenge',
    'verification required',
    'security verification',
    'bot detection',
    'rate limited'
  ];
  
  // Check URL patterns
  const securityUrlPatterns = [
    '/challenge',
    '/security',
    '/verify',
    '/captcha',
    '/blocked',
    '/access-denied'
  ];
  
  // Check if any security indicators are present
  for (const indicator of securityIndicators) {
    if (url.includes(indicator) || title.includes(indicator)) {
      return true;
    }
  }
  
  // Check URL patterns
  for (const pattern of securityUrlPatterns) {
    if (url.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

async function attemptSecurityChallengeBypass(tabId) {
  try {
    console.log(`🔄 Attempting to bypass security challenge for tab ${tabId}`);
    
    // Send message to content script to attempt bypass
    const bypassResult = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { 
        action: 'bypassSecurityChallenge' 
      }, (response) => {
        resolve(response || { success: false });
      });
    });
    
    if (bypassResult && bypassResult.success) {
      console.log(`✅ Security challenge bypass successful`);
      return true;
    } else {
      console.log(`❌ Security challenge bypass failed:`, bypassResult.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error(`❌ Error attempting security challenge bypass:`, error);
    return false;
  }
}

async function fetchOAuthToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['googleAccessToken', 'googleTokenExpiry'], (cfg) => {
      if (cfg.googleAccessToken && cfg.googleTokenExpiry && Date.now() < cfg.googleTokenExpiry - 30000) {
        resolve(cfg.googleAccessToken);
      } else {
        resolve(null);
      }
    });
  });
}

function extractSheetInfo(url) {
  try {
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = idMatch ? idMatch[1] : null;
    let gid = null;
    try {
      const u = new URL(url);
      if (u.hash) {
        const params = new URLSearchParams(u.hash.replace(/^#/, ''));
        const gidStr = params.get('gid');
        if (gidStr && /^\d+$/.test(gidStr)) gid = parseInt(gidStr, 10);
      }
    } catch (_) { }
    return { sheetId, gid };
  } catch (_) { return { sheetId: null, gid: null }; }
}

async function getSheetTitleByGid(sheetId, gid, token) {
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title))`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await resp.json();
  const found = (data.sheets || []).find(s => s.properties && s.properties.sheetId === gid);
  return found?.properties?.title || null;
}

async function getFirstSheetTitle(sheetId, token) {
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(title))`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await resp.json();
  return data.sheets?.[0]?.properties?.title || 'Sheet1';
}

async function runAutoCheck(sheetUrl, progressCb) {
  const token = await fetchOAuthToken();
  if (!token) throw new Error('Not signed in');
  const aiSettings = await new Promise((resolve) => chrome.storage.sync.get(['aiProvider'], resolve));
  const aiProvider = aiSettings.aiProvider || 'gemini';
  await resetRateLimitedKeys(); // Reset any expired rate limits
  const validKeys = await loadValidKeysForProvider(aiProvider);
  if (validKeys.length === 0) throw new Error(`No valid ${aiProvider} keys available`);
  
  const { sheetId, gid } = extractSheetInfo(sheetUrl);
  if (!sheetId) throw new Error('Invalid sheet URL');
  let sheetName = gid != null ? await getSheetTitleByGid(sheetId, gid, token) : null;
  if (!sheetName) sheetName = await getFirstSheetTitle(sheetId, token);
  const range = `${sheetName}!A:F`;
  const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`;
  const resp = await fetch(readUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error(`Read HTTP ${resp.status}`);
  const data = await resp.json();
  const values = data.values || [];
  autoCheckRunning = true;
  updateActionBadge('AC', '#1e88e5', 'Auto-check running');

  let currentKeyId = null;
  let keyRotationCount = 0;

  // First, collect all URLs that need to be processed
  const urlsToProcess = [];
  const processedUrls = new Set(); // Track URLs already in this session to avoid duplicates
  
  for (let i = 2; i <= values.length; i++) {
    if (!autoCheckRunning) break;
    const row = values[i - 1] || [];
    let url = row[2] || '';
    const status = row[5] || '';
    
    // Skip if no URL or already processed (checked, blocked, human_check, expired)
    if (!url) continue;
    if (status) {
      const statusLower = status.toLowerCase();
      if (statusLower.includes('checked') || 
          statusLower.includes('blocked') || 
          statusLower.includes('human_check') || 
          statusLower.includes('expired')) {
        console.log(`⏭️ Auto-check: Skipping already processed URL ${i}: ${url} (status: ${status})`);
        continue;
      }
    }
    
    // Normalize URL to convert application/confirmation pages to job posting URLs
    const originalUrl = url;
    url = normalizeJobUrl(url);
    if (url !== originalUrl) {
      console.log(`🔄 Auto-check: Normalized URL from ${originalUrl} to ${url}`);
    }
    
    // Skip if this URL is already in the current session (avoid duplicates)
    if (processedUrls.has(url)) {
      console.log(`⏭️ Auto-check: Skipping duplicate URL ${i}: ${url} (already in session)`);
      continue;
    }
    
    processedUrls.add(url);
    urlsToProcess.push({ rowIndex: i, url, originalRow: row });
  }

  console.log(`📋 Auto-check: Found ${urlsToProcess.length} URLs to process with dynamic parallel processing (max ${Math.max(1, Math.floor(validKeys.length / 2))} tabs)`);

  // Calculate max tabs based on available keys (keys / 2)
  const MAX_TABS = Math.max(1, Math.floor(validKeys.length / 5));
  console.log(`📋 Auto-check: Using max ${MAX_TABS} tabs (${validKeys.length} keys / 5)`);
  const activeTabs = new Map(); // tabId -> { rowIndex, url, originalRow, currentKey, status }
  let urlIndex = 0;
  let completedCount = 0;

  // Function to open next URL in queue
  async function openNextUrl() {
    if (urlIndex >= urlsToProcess.length || !autoCheckRunning) return null;
    
    const { rowIndex, url, originalRow } = urlsToProcess[urlIndex++];
    
    // Get next available key
    const currentKey = await getNextAvailableKey(validKeys, currentKeyId);
    if (!currentKey) {
      console.warn(`⚠️ Auto-check: No available ${aiProvider} keys for URL ${rowIndex}, stopping...`);
      return null;
    }
    currentKeyId = currentKey.id;
    if (keyRotationCount > 0) {
      console.log(`🔄 Auto-check: Rotated to ${aiProvider} key ${currentKey.masked} for URL ${rowIndex}`);
    }

    // Open URL
    updateActionBadge(`${rowIndex}`, '#1e88e5', `Row ${rowIndex} • Opening URL`);
    try { chrome.runtime.sendMessage({ action: 'autoCheckProgress', row: rowIndex, stage: 'opening', url }); } catch (_) { }
    
    let created;
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab && typeof currentTab.index === 'number' && typeof currentTab.windowId === 'number') {
        created = await chrome.tabs.create({ url, active: false, windowId: currentTab.windowId, index: currentTab.index + 1 });
      } else {
        created = await chrome.tabs.create({ url, active: false });
      }
    } catch (_) {
      created = await chrome.tabs.create({ url, active: false });
    }
    
    // Send the assigned key to the content script
    try {
      await chrome.tabs.sendMessage(created.id, {
        action: 'assignApiKey',
        keyId: currentKey.id,
        keyMasked: currentKey.masked,
        provider: aiProvider
      });
    } catch (_) { }

    try { await chrome.tabs.update(created.id, { active: false }); } catch (_) { }
    
    // Store tab info
    activeTabs.set(created.id, {
      rowIndex,
      url,
      originalRow,
      currentKey,
      status: 'opening'
    });
    
    console.log(`📋 Auto-check: Opened URL ${rowIndex} (${activeTabs.size}/${MAX_TABS} active tabs)`);
    return created.id;
  }

  // Function to process a single tab
  async function processTab(tabId) {
    const tabInfo = activeTabs.get(tabId);
    if (!tabInfo) return;
    
    const { rowIndex, url, originalRow, currentKey } = tabInfo;
    
    try {
      console.log(`🔍 Auto-check: Starting analysis for URL ${rowIndex} (${url})`);
      
      // Wait for tab to load
      updateActionBadge(`${rowIndex}`, '#43a047', `Row ${rowIndex} • Loading`);
      await waitForTabLoadComplete(tabId, 30000);
      // Check if the loaded page is a security challenge
      let tabInfo;
      try {
        tabInfo = await chrome.tabs.get(tabId);
      } catch (_) {
        tabInfo = null;
      }
      
      if (tabInfo && isSecurityChallengePage(tabInfo)) {
        console.log(`🛡️ Auto-check: Human verification page detected for URL ${rowIndex}, skipping analysis`);
        updateActionBadge(`${rowIndex}`, '#ff6b6b', `Row ${rowIndex} • Human Check Required`);
        
        // Mark as human check required in the sheet (skip AI analysis)
        const humanCheckRow = [originalRow[0] || '', originalRow[1] || '', url, originalRow[3] || '', 'human_check', 'checked', ''];
        const writeRange = `${sheetName}!A${rowIndex}:G${rowIndex}`;
        const writeBody = { range: writeRange, majorDimension: 'ROWS', values: [humanCheckRow] };
        const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(writeRange)}?valueInputOption=USER_ENTERED`;
        await fetch(writeUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(writeBody) });
        
        try { progressCb({ ok: true, row: rowIndex, humanCheck: true }); } catch (_) { }
        try { chrome.runtime.sendMessage({ action: 'autoCheckProgress', row: rowIndex, stage: 'human_check', url, reason: 'Human verification required' }); } catch (_) { }
        
        console.log(`⚠️ Auto-check: Marked URL ${rowIndex} as human check required - manual verification needed`);
        
        // Close the tab and continue to next
        try { await chrome.tabs.remove(tabId); } catch (_) { }
        // Cleanup and try to open next URL
        activeTabs.delete(tabId);
        completedCount++;
        if (urlIndex < urlsToProcess.length && activeTabs.size < MAX_TABS) {
          setTimeout(async () => {
            const newTabId = await openNextUrl();
            if (newTabId) {
              processTab(newTabId).catch(error => {
                console.error(`❌ Auto-check: Error in processTab for new tab ${newTabId}:`, error);
              });
            }
          }, 1000);
        }
        return;
      }
      
      // Ask content script for job info with retries up to 25s
      updateActionBadge(`${rowIndex}`, '#f4511e', `Row ${rowIndex} • Analyzing`);
      const jobResp = await requestJobInfoWithRetry(tabId, 25000);
      
      // Check if the key hit rate limit - close tab and skip recording
      if (jobResp && jobResp.rateLimited) {
        console.log(`🔒 Auto-check: Key ${currentKey.masked} hit rate limit, closing tab and skipping recording`);
        updateActionBadge(`${rowIndex}`, '#ff6b6b', `Row ${rowIndex} • Rate Limited`);
        
        // Close the tab immediately (do not mark key as rate limited to keep it available)
        try { await chrome.tabs.remove(tabId); } catch (_) { }
        // Cleanup and try to open next URL
        activeTabs.delete(tabId);
        completedCount++;
        if (urlIndex < urlsToProcess.length && activeTabs.size < MAX_TABS) {
          setTimeout(async () => {
            const newTabId = await openNextUrl();
            if (newTabId) {
              processTab(newTabId).catch(error => {
                console.error(`❌ Auto-check: Error in processTab for new tab ${newTabId}:`, error);
              });
            }
          }, 1000);
        }
        return;
      }
      
      // Check if we got valid job content
      if (jobResp && jobResp.ok && jobResp.jobInfo) {
        const info = jobResp.jobInfo;
        const hasValidContent = info.position && info.position.trim() !== '' && 
                               (info.company || info.industry || info.jobType);
        
        if (!hasValidContent) {
          console.log(`⚠️ Auto-check: Job info appears incomplete for URL ${rowIndex}, may need more time to load`);
          updateActionBadge(`${rowIndex}`, '#ffa500', `Row ${rowIndex} • Retrying`);
          
          // Wait a bit more and try again
          await new Promise(r => setTimeout(r, 5000));
          
          // Try one more time
          const retryJobResp = await requestJobInfoWithRetry(tabId, 15000);
          if (retryJobResp && retryJobResp.ok && retryJobResp.jobInfo) {
            const retryInfo = retryJobResp.jobInfo;
            const retryHasValidContent = retryInfo.position && retryInfo.position.trim() !== '' && 
                                       (retryInfo.company || retryInfo.industry || retryInfo.jobType);
            
            if (retryHasValidContent) {
              console.log(`✅ Auto-check: Got valid job content on retry for URL ${rowIndex}`);
              // Use the retry result
              jobResp.jobInfo = retryInfo;
            } else {
              console.log(`❌ Auto-check: Still no valid job content after retry for URL ${rowIndex}`);
            }
          }
        }
      }

      // Only write to sheet if analysis was successful
      if (jobResp && jobResp.ok && jobResp.jobInfo) {
        // Merge extracted jobInfo with existing cells
        const info = jobResp.jobInfo;
        const finalCompany = originalRow[0] || info.company || '';
        const finalPosition = originalRow[1] || info.position || '';
        const finalIndustry = originalRow[3] || info.industry || '';
        const finalJobType = (info.jobType || originalRow[4] || '').toLowerCase();
        
        // Check if company size is clearly defined and less than 100
        let smallCompanyMarker = '';
        if (info.teamSize && info.teamSize !== 'Not specified') {
          // Extract number from team size (e.g., "50 employees" -> 50, "100+ people" -> 100)
          const teamSizeMatch = info.teamSize.match(/(\d+)/);
          if (teamSizeMatch) {
            const teamSize = parseInt(teamSizeMatch[1]);
            if (teamSize < 100) {
              smallCompanyMarker = 'Startup';
              console.log(`🏢 Small company detected: ${finalCompany} (${info.teamSize})`);
            }
          }
        }
        
        const newRow = [finalCompany, finalPosition, url, finalIndustry, finalJobType || '', 'checked', smallCompanyMarker];
        const writeRange = `${sheetName}!A${rowIndex}:G${rowIndex}`;
        const writeBody = { range: writeRange, majorDimension: 'ROWS', values: [newRow] };
        const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(writeRange)}?valueInputOption=USER_ENTERED`;
        await fetch(writeUrl, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(writeBody) });

        try { progressCb({ ok: true, row: rowIndex }); } catch (_) { }
        try { chrome.runtime.sendMessage({ action: 'autoCheckProgress', row: rowIndex, stage: 'written', url, jobType: finalJobType }); } catch (_) { }
        
        console.log(`✅ Auto-check: Completed analysis for URL ${rowIndex}`);
      } else {
        console.log(`⚠️ Auto-check: Analysis incomplete for URL ${rowIndex}, not marking as checked`);
        try { chrome.runtime.sendMessage({ action: 'autoCheckProgress', row: rowIndex, stage: 'incomplete', url }); } catch (_) { }
      }
      
      // Close the tab after analysis (regardless of success)
      try { await chrome.tabs.remove(tabId); } catch (_) { }
    } catch (error) {
      console.error(`❌ Auto-check: Error analyzing URL ${rowIndex}:`, error);
      // Close the tab on error
      try { await chrome.tabs.remove(tabId); } catch (_) { }
      console.log(`❌ Auto-check: Failed analysis for URL ${rowIndex}`);
    } finally {
      // Always cleanup and try to open next URL
      activeTabs.delete(tabId);
      completedCount++;
      
      // Try to open next URL if there are more to process
      if (urlIndex < urlsToProcess.length && activeTabs.size < MAX_TABS) {
        setTimeout(async () => {
          const newTabId = await openNextUrl();
          if (newTabId) {
            processTab(newTabId).catch(error => {
              console.error(`❌ Auto-check: Error in processTab for new tab ${newTabId}:`, error);
            });
          }
        }, 1000); // 1 second delay before opening next
      }
    }
  }

  // Function to start processing
  async function startProcessing() {
    // Initially open up to MAX_TABS URLs with 1-second delay between each
    for (let i = 0; i < Math.min(MAX_TABS, urlsToProcess.length); i++) {
      if (!autoCheckRunning) break;
      const tabId = await openNextUrl();
      
      // Start analysis immediately after opening (don't wait)
      if (tabId) {
        processTab(tabId).catch(error => {
          console.error(`❌ Auto-check: Error in processTab for tab ${tabId}:`, error);
        });
      }
      
      // Wait 1 second before opening next URL (except for the last one)
      if (i < Math.min(MAX_TABS, urlsToProcess.length) - 1) {
        console.log(`⏱️ Auto-check: Waiting 1 second before opening next URL...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    console.log(`📋 Auto-check: Started with ${activeTabs.size} active tabs, analysis running in parallel`);
    
    // Wait for all remaining tabs to complete
    while (activeTabs.size > 0 && autoCheckRunning) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // Start the dynamic parallel processing
  await startProcessing();

  console.log(`📋 Auto-check: All URLs processed! (${completedCount}/${urlsToProcess.length})`);

  // Final cleanup - close any remaining tabs
  const remainingTabs = Array.from(activeTabs.keys());
  if (remainingTabs.length > 0) {
    console.log(`🧹 Auto-check: Closing ${remainingTabs.length} remaining tabs...`);
    for (const tabId of remainingTabs) {
      try { 
        await chrome.tabs.remove(tabId); 
        console.log(`🗑️ Auto-check: Closed remaining tab ${tabId}`);
      } catch (error) {
        console.log(`⚠️ Auto-check: Failed to close remaining tab ${tabId}:`, error);
      }
    }
    activeTabs.clear();
  }

  autoCheckRunning = false;
  try { progressCb({ ok: true, done: true }); } catch (_) { }
  try { chrome.runtime.sendMessage({ action: 'autoCheckProgress', done: true }); } catch (_) { }
  updateActionBadge('', undefined, '');
}

// Function to cleanup all active tabs when auto-check is stopped
async function cleanupActiveTabs() {
  if (typeof activeTabs !== 'undefined' && activeTabs.size > 0) {
    console.log(`🧹 Auto-check: Cleaning up ${activeTabs.size} active tabs...`);
    const tabsToClose = Array.from(activeTabs.keys());
    for (const tabId of tabsToClose) {
      try { 
        await chrome.tabs.remove(tabId); 
        console.log(`🗑️ Auto-check: Closed tab ${tabId}`);
      } catch (error) {
        console.log(`⚠️ Auto-check: Failed to close tab ${tabId}:`, error);
      }
    }
    activeTabs.clear();
  }
}

async function waitForTabLoadComplete(tabId, timeoutMs) {
  const start = Date.now();
  return new Promise((resolve) => {
    function checkComplete(updatedTabId, info) {
      if (updatedTabId === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(checkComplete);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(checkComplete);
    const timer = setInterval(async () => {
      if (Date.now() - start > timeoutMs) {
        chrome.tabs.onUpdated.removeListener(checkComplete);
        clearInterval(timer);
        resolve();
      }
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(checkComplete);
          clearInterval(timer);
          resolve();
        }
      } catch (_) {
        chrome.tabs.onUpdated.removeListener(checkComplete);
        clearInterval(timer);
        resolve();
      }
    }, 500);
  });
}

async function requestJobInfoWithRetry(tabId, totalWaitMs) {
  const start = Date.now();
  let lastResp = { ok: false };
  while (Date.now() - start < totalWaitMs) {
    lastResp = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'requestJobInfo', timeoutMs: 12000 }, (resp) => {
        resolve(resp || { ok: false });
      });
    });
    if (lastResp && lastResp.ok) break;
    if (lastResp && lastResp.rateLimited) {
      // If rate limited, return immediately with rate limit flag
      return { ok: false, rateLimited: true };
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  return lastResp || { ok: false };
}

// Handle getApiKeys request from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'getApiKeys') {
    (async () => {
      try {
        // Load from Chrome storage (background scripts can't access localStorage)
        const result = await new Promise((resolve, reject) => {
          chrome.storage.local.get(['openaiKeys', 'geminiKeys'], (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result);
            }
          });
        });

        const openaiKeys = result.openaiKeys || [];
        const geminiKeys = result.geminiKeys || [];

        console.log('Background: Sending API keys to content script:', {
          openai: openaiKeys.length,
          gemini: geminiKeys.length
        });

        // Debug: Log key details
        if (openaiKeys.length > 0) {
          console.log('OpenAI keys:', openaiKeys.map(k => ({ id: k.id, masked: k.masked, status: k.status })));
        }
        if (geminiKeys.length > 0) {
          console.log('Gemini keys:', geminiKeys.map(k => ({ id: k.id, masked: k.masked, status: k.status })));
        }

        try {
          sendResponse({
            success: true,
            openaiKeys: openaiKeys,
            geminiKeys: geminiKeys
          });
        } catch (_) { }
      } catch (error) {
        console.error('Background: Error loading API keys for content script:', error);
        try {
          sendResponse({
            success: false,
            error: error.message
          });
        } catch (_) { }
      }
    })();
    return true;
  }
});

// Test API key validity in background
async function testApiKeyInBackground(provider, apiKey) {
  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } else if (provider === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET'
      });
      return response.ok;
    }
    return false;
  } catch (error) {
    console.error(`API key test failed for ${provider}:`, error);
    return false;
  }
}

// Pre-assign API keys to URLs using urlNumber % numberOfApiKeys
function preAssignKeysToUrls(aiProvider, openaiKeys, geminiKeys, urls) {
  const validOpenaiKeys = openaiKeys.filter(key => key.status === 'valid');
  const validGeminiKeys = geminiKeys.filter(key => key.status === 'valid');

  const assignments = [];

  for (let i = 0; i < urls.length; i++) {
    const urlNumber = i + 1; // 1-based indexing
    let assignedKey = null;

    if (aiProvider === 'openai' && validOpenaiKeys.length > 0) {
      const keyIndex = (urlNumber - 1) % validOpenaiKeys.length; // 0-based for array indexing
      assignedKey = validOpenaiKeys[keyIndex];
    } else if (aiProvider === 'gemini' && validGeminiKeys.length > 0) {
      const keyIndex = (urlNumber - 1) % validGeminiKeys.length; // 0-based for array indexing
      assignedKey = validGeminiKeys[keyIndex];
    }

    assignments.push({
      urlNumber: urlNumber,
      url: urls[i],
      keyId: assignedKey?.id || null,
      keyMasked: assignedKey?.masked || null,
      provider: aiProvider,
      keyIndex: assignedKey ? (urlNumber - 1) % (aiProvider === 'openai' ? validOpenaiKeys.length : validGeminiKeys.length) : null
    });
  }

  console.log(`🔑 Pre-assigned ${assignments.length} URLs to ${aiProvider} keys:`, {
    totalUrls: urls.length,
    availableKeys: aiProvider === 'openai' ? validOpenaiKeys.length : validGeminiKeys.length,
    assignments: assignments.map(a => ({
      urlNumber: a.urlNumber,
      keyIndex: a.keyIndex,
      keyId: a.keyId,
      keyMasked: a.keyMasked
    }))
  });

  return assignments;
}

// Store URL-key assignments for content scripts to access
async function storeUrlKeyAssignments(assignments) {
  try {
    // Store in chrome.storage.local for quick access by content scripts
    await chrome.storage.local.set({
      'urlKeyAssignments': assignments,
      'urlKeyAssignmentsTimestamp': Date.now()
    });
    console.log(`💾 Stored ${assignments.length} URL-key assignments`);
  } catch (error) {
    console.error('Failed to store URL-key assignments:', error);
  }
}

// Calculate RPM-aware opening strategy based on API limits
function calculateRpmAwareOpeningStrategy(aiProvider, openaiKeys, geminiKeys, totalUrls) {
  const validGeminiKeys = geminiKeys.filter(key => key.status === 'valid').length;

  let strategy = {
    provider: aiProvider,
    totalUrls: totalUrls,
    batchSize: 1,
    batchDelay: 300, // Default: 0.3s for OpenAI or no AI key
    totalBatches: Math.ceil(totalUrls / 1),
    estimatedTime: (totalUrls - 1) * 300
  };

  if (aiProvider === 'gemini' && validGeminiKeys > 0) {
    // Gemini: max(2000ms, 60s/(15 * api_key_count)) - increased delays to prevent rate limiting
    const delayPerKey = 60000 / (15 * validGeminiKeys); // 60s / (15 * key_count) - back to 60s
    const calculatedDelay = delayPerKey;
    const finalDelay = Math.max(2000, calculatedDelay); // Increased minimum to 2000ms to prevent rate limiting

    strategy.batchDelay = finalDelay;
    strategy.batchSize = 1; // Open one URL at a time
    strategy.totalBatches = totalUrls;
    strategy.estimatedTime = (totalUrls - 1) * finalDelay;

    console.log(`🔑 Gemini Strategy: ${validGeminiKeys} keys, delay per key: ${delayPerKey}ms, calculated: ${calculatedDelay}ms, final: ${finalDelay}ms`);
  } else {
    // OpenAI or no AI key: 0.1s (100ms) delay
    strategy.batchDelay = 100;
    strategy.batchSize = 1;
    strategy.totalBatches = totalUrls;
    strategy.estimatedTime = (totalUrls - 1) * 100;

    console.log(`🔑 OpenAI/No AI Strategy: 100ms delay between URLs`);
  }

  // Add safety margin and round values
  strategy.batchDelay = Math.round(strategy.batchDelay);
  strategy.estimatedTime = Math.round(strategy.estimatedTime);

  console.log(`📊 RPM-Aware Strategy Calculated:`, {
    provider: strategy.provider,
    batchSize: strategy.batchSize,
    batchDelay: `${strategy.batchDelay}ms (${strategy.batchDelay / 1000}s)`,
    totalBatches: strategy.totalBatches,
    estimatedTime: `${strategy.estimatedTime / 1000}s`
  });

  return strategy;
}

// Legacy function for backward compatibility
function calculateSmartUrlDelay(aiProvider, geminiKeys) {
  if (aiProvider !== 'gemini') {
    return 300; // OpenAI or no AI key: 0.3s
  }

  const validGeminiKeys = geminiKeys.filter(key => key.status === 'valid').length;

  if (validGeminiKeys <= 0) {
    return 300; // Fallback to 300ms if no keys
  }

  // Gemini: max(200ms, 60s/(15 * api_key_count))
  const delayPerKey = 60000 / (15 * validGeminiKeys); // 60s / (15 * key_count)
  const calculatedDelay = delayPerKey;
  const finalDelay = Math.max(1000, calculatedDelay);

  return Math.round(finalDelay);
}


