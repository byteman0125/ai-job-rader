// IndexedDB Storage Manager for large numbers of API keys
class ApiKeyStorageManager {
  constructor() {
    this.dbName = 'JobRadarApiKeys';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores for API keys
        if (!db.objectStoreNames.contains('openaiKeys')) {
          const openaiStore = db.createObjectStore('openaiKeys', { keyPath: 'id' });
          openaiStore.createIndex('key', 'key', { unique: true });
          openaiStore.createIndex('status', 'status');
        }
        
        if (!db.objectStoreNames.contains('geminiKeys')) {
          const geminiStore = db.createObjectStore('geminiKeys', { keyPath: 'id' });
          geminiStore.createIndex('key', 'key', { unique: true });
          geminiStore.createIndex('status', 'status');
        }
      };
    });
  }

  async saveApiKeys(provider, keys) {
    if (!this.db) await this.init();
    
    const storeName = provider === 'openai' ? 'openaiKeys' : 'geminiKeys';
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Clear existing keys first
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
    
    // Add new keys
    const promises = keys.map(key => {
      return new Promise((resolve, reject) => {
        const addRequest = store.add(key);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    });
    
    await Promise.all(promises);
    console.log(`✅ Saved ${keys.length} ${provider} keys to IndexedDB`);
  }

  async loadApiKeys(provider) {
    if (!this.db) await this.init();
    
    const storeName = provider === 'openai' ? 'openaiKeys' : 'geminiKeys';
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
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
          }).catch(() => {});
        }
      });
    });
    try { sendResponse({ status: 'broadcasted' }); } catch (_) {}
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
        } catch (_) {}
        
      } catch (error) {
        console.error('Failed to save API keys to storage:', error);
        try {
          sendResponse({ status: 'error', error: error.message });
        } catch (_) {}
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
                }).catch(() => {});
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
        } catch (_) {}
        
      } catch (error) {
        console.error('Background API key processing failed:', error);
        try {
          sendResponse({ status: 'error', error: error.message });
        } catch (_) {}
      }
    })();
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
          console.log(`⏳ Waiting ${openingStrategy.batchDelay}ms before next batch (${openingStrategy.batchDelay/1000}s)`);
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

// Handle getApiKeys request from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === 'getApiKeys') {
    (async () => {
      try {
        const [openaiKeys, geminiKeys] = await Promise.all([
          apiKeyStorage.loadApiKeys('openai'),
          apiKeyStorage.loadApiKeys('gemini')
        ]);
        
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
        } catch (_) {}
      } catch (error) {
        console.error('Background: Error loading API keys for content script:', error);
        try {
          sendResponse({
            success: false,
            error: error.message
          });
        } catch (_) {}
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
  const validOpenaiKeys = openaiKeys.filter(key => key.status === 'valid').length;
  const validGeminiKeys = geminiKeys.filter(key => key.status === 'valid').length;
  
  let strategy = {
    provider: aiProvider,
    totalUrls: totalUrls,
    batchSize: 1,
    batchDelay: 1000,
    totalBatches: Math.ceil(totalUrls / 1),
    estimatedTime: totalUrls * 1000
  };
  
  if (aiProvider === 'openai') {
    // OpenAI: 500 RPM per key, 3 requests per minute per key
    const totalRpm = validOpenaiKeys * 500; // 500 RPM per key
    const requestsPerMinute = validOpenaiKeys * 3; // Conservative: 3 requests per minute per key
    
    if (validOpenaiKeys > 0) {
      strategy.batchSize = Math.min(validOpenaiKeys, totalUrls);
      strategy.batchDelay = Math.max(60000 / requestsPerMinute, 20000); // At least 20 seconds between batches
      strategy.totalBatches = Math.ceil(totalUrls / strategy.batchSize);
      strategy.estimatedTime = (strategy.totalBatches - 1) * strategy.batchDelay;
      
      console.log(`🔑 OpenAI Strategy: ${validOpenaiKeys} keys, ${totalRpm} RPM, ${requestsPerMinute} req/min`);
    }
  } else if (aiProvider === 'gemini') {
    // Gemini: 15 RPM per key, 1 request per 4 seconds per key
    const totalRpm = validGeminiKeys * 15; // 15 RPM per key
    const requestsPerMinute = validGeminiKeys * 15; // 15 requests per minute per key
    
    if (validGeminiKeys > 0) {
      strategy.batchSize = Math.min(validGeminiKeys, totalUrls);
      strategy.batchDelay = Math.max(60000 / requestsPerMinute, 4000); // At least 4 seconds between batches
      strategy.totalBatches = Math.ceil(totalUrls / strategy.batchSize);
      strategy.estimatedTime = (strategy.totalBatches - 1) * strategy.batchDelay;
      
      console.log(`🔑 Gemini Strategy: ${validGeminiKeys} keys, ${totalRpm} RPM, ${requestsPerMinute} req/min`);
    }
  }
  
  // Add safety margin and round values
  strategy.batchDelay = Math.round(strategy.batchDelay);
  strategy.estimatedTime = Math.round(strategy.estimatedTime);
  
  console.log(`📊 RPM-Aware Strategy Calculated:`, {
    provider: strategy.provider,
    batchSize: strategy.batchSize,
    batchDelay: `${strategy.batchDelay}ms (${strategy.batchDelay/1000}s)`,
    totalBatches: strategy.totalBatches,
    estimatedTime: `${strategy.estimatedTime/1000}s`
  });
  
  return strategy;
}

// Legacy function for backward compatibility
function calculateSmartUrlDelay(aiProvider, geminiKeys) {
  if (aiProvider !== 'gemini') {
    return 200;
  }
  
  const validGeminiKeys = geminiKeys.filter(key => key.status === 'valid').length;
  
  if (validGeminiKeys <= 1) {
    return 200;
  }

  
  // Adjust based on number of keys (more keys = can open faster)
  const adjustedDelay = 60 * 1000 / Math.sqrt(validGeminiKeys);
  
  // Minimum 200ms, maximum 2 seconds
  const finalDelay = Math.max(200, Math.min(500, adjustedDelay));
  
  return Math.round(finalDelay);
}


