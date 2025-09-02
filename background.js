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
      for (const url of urls) {
        try {
          await chrome.tabs.create({ url, active: false });
          // Throttle slightly to avoid overwhelming the browser
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          // Continue with next URL even if one fails
        }
      }
      try {
        sendResponse({ status: 'done', count: urls.length });
      } catch (_) {
        // noop if response port is closed
      }
    })();
    // Indicate we will respond asynchronously
    return true;
  }
});


