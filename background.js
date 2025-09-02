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

  if (message && message.action === 'openUrlsInBackground' && Array.isArray(message.urls)) {
    (async () => {
      const urls = message.urls;
      
      // Get AI settings to calculate smart delays
      const aiSettings = await chrome.storage.sync.get(['aiProvider', 'geminiKeys']);
      const aiProvider = aiSettings.aiProvider || 'openai';
      const geminiKeys = aiSettings.geminiKeys || [];
      
      // Calculate smart delay between opening URLs
      const smartDelay = calculateSmartUrlDelay(aiProvider, geminiKeys);
      
      console.log(`🚀 Opening ${urls.length} URLs with ${smartDelay}ms delay between each`);
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        try {
          await chrome.tabs.create({ url, active: false });
          
          // Add smart delay between opening URLs (except for the last one)
          if (i < urls.length - 1) {
            console.log(`⏳ Waiting ${smartDelay}ms before opening next URL (${i + 1}/${urls.length})`);
            await new Promise(resolve => setTimeout(resolve, smartDelay));
          }
        } catch (error) {
          console.error(`Failed to open URL ${i + 1}:`, error);
          // Continue with next URL even if one fails
        }
      }
      
      console.log(`✅ Finished opening ${urls.length} URLs with smart delays`);
      
      try {
        sendResponse({ status: 'done', count: urls.length, delay: smartDelay });
      } catch (_) {
        // noop if response port is closed
      }
    })();
    // Indicate we will respond asynchronously
    return true;
  }
});

// Calculate smart delay between opening URLs based on AI provider and key count
function calculateSmartUrlDelay(aiProvider, geminiKeys) {
  if (aiProvider !== 'gemini') {
    return 1000; // 1 second for OpenAI
  }
  
  const validGeminiKeys = geminiKeys.filter(key => key.status === 'valid').length;
  
  if (validGeminiKeys <= 1) {
    return 6000; // 6 seconds for single key
  }
  
  // Estimate user might open 30-60 job pages
  const estimatedPages = 45;
  
  // Calculate optimal delay: 60 seconds / estimated pages
  const totalTimeSeconds = 60;
  const delayPerPage = (totalTimeSeconds * 1000) / estimatedPages;
  
  // Adjust based on number of keys (more keys = can open faster)
  const adjustedDelay = delayPerPage / Math.sqrt(validGeminiKeys);
  
  // Minimum 1 second, maximum 10 seconds
  const finalDelay = Math.max(1000, Math.min(10000, adjustedDelay));
  
  console.log(`📊 Smart URL delay calculation: ${validGeminiKeys} Gemini keys, ~${estimatedPages} pages, ${finalDelay.toFixed(0)}ms delay`);
  
  return Math.round(finalDelay);
}


