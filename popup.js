document.addEventListener('DOMContentLoaded', function() {
  // About Extension elements
  const aboutBtn = document.getElementById('aboutBtn');
  const aboutModal = document.getElementById('aboutModal');
  const closeModal = document.getElementById('closeModal');
  
  // Profile elements
  const userLocation = document.getElementById('userLocation');
  const saveLocation = document.getElementById('saveLocation');
  const editLocation = document.getElementById('editLocation');
  const locationStatus = document.getElementById('locationStatus');
  
  const workExperience = document.getElementById('workExperience');
  const saveExperience = document.getElementById('saveExperience');
  const editExperience = document.getElementById('editExperience');
  const experienceStatus = document.getElementById('experienceStatus');
  
  const profileLocation = document.getElementById('profileLocation');
  const profileExperience = document.getElementById('profileExperience');
  
  const keywordInput = document.getElementById('keywordInput');
  const colorPicker = document.getElementById('colorPicker');
  const addButton = document.getElementById('addKeyword');
  const keywordList = document.getElementById('keywordList');
  const totalCount = document.getElementById('totalCount');
  const matchCount = document.getElementById('matchCount');
  
  // AI Settings elements
  const openaiProvider = document.getElementById('openaiProvider');
  const geminiProvider = document.getElementById('geminiProvider');
  const openaiSection = document.getElementById('openai-section');
  const geminiSection = document.getElementById('gemini-section');
  const openaiKeysContainer = document.getElementById('openaiKeysContainer');
  const geminiKeysContainer = document.getElementById('geminiKeysContainer');
  const openaiKeyInput = document.getElementById('openaiKeyInput');
  const geminiKeyInput = document.getElementById('geminiKeyInput');
  const addOpenaiKey = document.getElementById('addOpenaiKey');
  const addGeminiKey = document.getElementById('addGeminiKey');
  const activeProvider = document.getElementById('activeProvider');
  const totalKeys = document.getElementById('totalKeys');
  const lastUsed = document.getElementById('lastUsed');
  
  // Job Radar toggle element
  const jobRadarToggle = document.getElementById('jobRadarToggle');
  // Copy preferences elements
  const copyIncludeIndustry = document.getElementById('copyIncludeIndustry');
  const copyIncludeTechStack = document.getElementById('copyIncludeTechStack');
  const copyIncludeMatchRate = document.getElementById('copyIncludeMatchRate');
  
  // About Extension functionality
  aboutBtn.addEventListener('click', function() {
    aboutModal.style.display = 'flex';
  });
  
  closeModal.addEventListener('click', function() {
    aboutModal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  aboutModal.addEventListener('click', function(e) {
    if (e.target === aboutModal) {
      aboutModal.style.display = 'none';
    }
  });
  
  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && aboutModal.style.display === 'flex') {
      aboutModal.style.display = 'none';
    }
  });
  
  // Profile functionality
  function showStatusMessage(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
    
    setTimeout(() => {
      element.style.display = 'none';
    }, 3000);
  }
  
  function updateProfileSummary() {
    chrome.storage.sync.get(['userLocation', 'workExperience'], function(result) {
      profileLocation.textContent = result.userLocation || 'Not set';
      profileExperience.textContent = result.workExperience ? 'Set' : 'Not set';
    });
  }
  
  // Location functionality
  saveLocation.addEventListener('click', function() {
    const location = userLocation.value.trim();
    if (location) {
      chrome.storage.sync.set({userLocation: location}, function() {
        userLocation.disabled = true;
        userLocation.classList.add('disabled');
        saveLocation.style.display = 'none';
        editLocation.style.display = 'inline-block';
        showStatusMessage(locationStatus, 'Location saved successfully!', 'success');
        updateProfileSummary();
        
        // Notify content script about profile update
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'profileUpdated',
              userLocation: location
            }).catch(() => {
              // Ignore errors for tabs that don't have the content script
            });
          }
        });
      });
    } else {
      showStatusMessage(locationStatus, 'Please enter a location', 'error');
    }
  });
  
  editLocation.addEventListener('click', function() {
    userLocation.disabled = false;
    userLocation.classList.remove('disabled');
    saveLocation.style.display = 'inline-block';
    editLocation.style.display = 'none';
    userLocation.focus();
  });
  
  // Experience functionality
  saveExperience.addEventListener('click', function() {
    const experience = workExperience.value.trim();
    if (experience) {
      chrome.storage.sync.set({workExperience: experience}, function() {
        workExperience.disabled = true;
        workExperience.classList.add('disabled');
        saveExperience.style.display = 'none';
        editExperience.style.display = 'inline-block';
        showStatusMessage(experienceStatus, 'Work experience saved successfully!', 'success');
        updateProfileSummary();
        
        // Notify content script about profile update
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'profileUpdated',
              workExperience: experience
            }).catch(() => {
              // Ignore errors for tabs that don't have the content script
            });
          }
        });
      });
    } else {
      showStatusMessage(experienceStatus, 'Please enter your work experience', 'error');
    }
  });
  
  editExperience.addEventListener('click', function() {
    workExperience.disabled = false;
    workExperience.classList.remove('disabled');
    saveExperience.style.display = 'inline-block';
    editExperience.style.display = 'none';
    workExperience.focus();
  });
  
  // Load saved profile data
  chrome.storage.sync.get(['userLocation', 'workExperience'], function(result) {
    if (result.userLocation) {
      userLocation.value = result.userLocation;
      userLocation.disabled = true;
      userLocation.classList.add('disabled');
      saveLocation.style.display = 'none';
      editLocation.style.display = 'inline-block';
    }
    
    if (result.workExperience) {
      workExperience.value = result.workExperience;
      workExperience.disabled = true;
      workExperience.classList.add('disabled');
      saveExperience.style.display = 'none';
      editExperience.style.display = 'inline-block';
    }
    
    updateProfileSummary();
  });
  
  // Job Radar toggle functionality
  jobRadarToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    
    // Save the state
    chrome.storage.sync.set({jobRadarEnabled: isEnabled}, function() {
      // Update all tabs with the new state
      updateJobRadarState(isEnabled);
      
      // Show feedback
      if (isEnabled) {
        showSuccessMessage('Job Radar enabled!');
      } else {
        showSuccessMessage('Job Radar disabled!');
      }
    });
  });
  
  // Function to update Job Radar state across all tabs
  function updateJobRadarState(isEnabled) {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateJobRadarState',
          enabled: isEnabled
        }).catch(() => {
          // Ignore errors for tabs that don't have the content script
        });
      });
    });
  }
  
  // AI Settings functionality
  let currentProvider = 'openai';
  let openaiKeys = [];
  let geminiKeys = [];
  let selectedOpenaiKey = null;
  let selectedGeminiKey = null;
  
  // Tab management elements
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Tab switching functionality
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        this.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });
  
  // URL Opener functionality
  const urlTextarea = document.getElementById('urlTextarea');
  const openUrlsBtn = document.getElementById('openUrlsBtn');
  const urlStatus = document.getElementById('urlStatus');
  
  function showUrlStatus(message, type) {
    urlStatus.textContent = message;
    urlStatus.className = `url-status ${type}`;
    urlStatus.style.display = 'block';
    
    setTimeout(() => {
      urlStatus.style.display = 'none';
    }, 3000);
  }
  
  function isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  function extractUrls(text) {
    // Split by newlines and commas, then filter valid URLs
    const urls = text
      .split(/[\n,]/)
      .map(url => url.trim())
      .filter(url => url.length > 0)
      .filter(url => isValidUrl(url));
    
    return urls;
  }
  
  openUrlsBtn.addEventListener('click', async () => {
    const text = urlTextarea.value.trim();
    
    if (!text) {
      showUrlStatus('Please enter some URLs first', 'error');
      return;
    }
    
    const urls = extractUrls(text);
    
    if (urls.length === 0) {
      showUrlStatus('No valid URLs found. Please check your input.', 'error');
      return;
    }
    
    try {
      // Calculate and show expected delay
      const suggestedDelay = calculateSuggestedUrlDelay();
      const totalTime = Math.round((urls.length - 1) * suggestedDelay / 1000);
      
      showUrlStatus(`Opening ${urls.length} URL(s) with ${suggestedDelay/1000}s delay between each (${totalTime}s total)...`, 'info');
      
      // Delegate URL opening to background service worker so it continues even if popup closes
      await chrome.runtime.sendMessage({
        action: 'openUrlsInBackground',
        urls
      });

      showUrlStatus(`✅ Started opening ${urls.length} URL(s) with smart delays`, 'success');
      urlTextarea.value = ''; // Clear after dispatching

    } catch (error) {
      console.error('Error opening URLs:', error);
      showUrlStatus('Error opening URLs. Please try again.', 'error');
    }
  });
  
  // Default keywords with beautiful colors
  const defaultKeywords = [
    { text: 'remote', color: '#FF6B6B' },
    { text: 'start-up', color: '#4ECDC4' },
    { text: 'startup', color: '#4ECDC4' },
    { text: 'on-site', color: '#45B7D1' },
    { text: 'onsite', color: '#45B7D1' },
    { text: 'hybrid', color: '#96CEB4' },
    { text: 'In-office', color: '#FFEAA7' },
    { text: 'in office', color: '#FFEAA7' },
    { text: 'relocate', color: '#DDA0DD' }
  ];
  
  // Load settings from storage
  chrome.storage.sync.get(['keywords', 'aiProvider', 'openaiKeys', 'geminiKeys', 'selectedOpenaiKey', 'selectedGeminiKey', 'openaiApiKey', 'jobRadarEnabled', 'copyIncludeIndustry', 'copyIncludeTechStack', 'copyIncludeMatchRate'], function(result) {
    let keywords = result.keywords;
    
    // Initialize with default keywords if none exist
    if (!keywords || keywords.length === 0) {
      keywords = defaultKeywords;
      chrome.storage.sync.set({keywords: defaultKeywords});
    }
    
    renderKeywords(keywords);
    updateStats(keywords);
    
    // Load AI provider settings
    currentProvider = result.aiProvider || 'openai';
    openaiKeys = result.openaiKeys || [];
    geminiKeys = result.geminiKeys || [];
    selectedOpenaiKey = result.selectedOpenaiKey || null;
    selectedGeminiKey = result.selectedGeminiKey || null;
    
    // Migration: Convert old single API key to new format
    if (result.openaiApiKey && openaiKeys.length === 0) {
      console.log('Migrating old OpenAI API key to new format...');
      const keyId = Date.now().toString();
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
      
      // Save the migrated data and remove old key
      chrome.storage.sync.set({
        openaiKeys: openaiKeys,
        selectedOpenaiKey: selectedOpenaiKey
      });
      chrome.storage.sync.remove(['openaiApiKey']);
      
      console.log('Migration complete, testing API key...');
      // Test the migrated key
      testApiKey('openai', keyId);
    } else if (openaiKeys.length === 0) {
      console.log('No OpenAI keys found. User needs to add API key manually.');
    }
    
    // Update UI
    updateProviderSelection();
    renderApiKeys();
    updateApiStats();
    
    // Debug: Log current state
    console.log('Current AI Settings:', {
      provider: currentProvider,
      openaiKeys: openaiKeys.length,
      geminiKeys: geminiKeys.length,
      selectedOpenaiKey,
      selectedGeminiKey,
      hasOldKey: !!result.openaiApiKey
    });
    
    // Load Job Radar toggle state (default to enabled)
    const isEnabled = result.jobRadarEnabled !== false; // Default to true if not set
    jobRadarToggle.checked = isEnabled;
    
    // Update all tabs with the current state
    updateJobRadarState(isEnabled);

    // Initialize copy preferences (defaults false)
    copyIncludeIndustry.checked = result.copyIncludeIndustry === true;
    copyIncludeTechStack.checked = result.copyIncludeTechStack === true;
    copyIncludeMatchRate.checked = result.copyIncludeMatchRate === true;
  });

  // Persist copy preferences
  function saveCopyPrefs() {
    chrome.storage.sync.set({
      copyIncludeIndustry: copyIncludeIndustry.checked,
      copyIncludeTechStack: copyIncludeTechStack.checked,
      copyIncludeMatchRate: copyIncludeMatchRate.checked
    });
  }

  copyIncludeIndustry && copyIncludeIndustry.addEventListener('change', saveCopyPrefs);
  copyIncludeTechStack && copyIncludeTechStack.addEventListener('change', saveCopyPrefs);
  copyIncludeMatchRate && copyIncludeMatchRate.addEventListener('change', saveCopyPrefs);
  
  // AI Provider Selection
  openaiProvider.addEventListener('change', function() {
    if (this.checked) {
      currentProvider = 'openai';
      updateProviderSelection();
      saveAiSettings();
    }
  });
  
  geminiProvider.addEventListener('change', function() {
    if (this.checked) {
      currentProvider = 'gemini';
      updateProviderSelection();
      saveAiSettings();
    }
  });
  
  // Add API Key functionality
  addOpenaiKey.addEventListener('click', async function() {
    const apiKey = openaiKeyInput.value.trim();
    if (apiKey) {
      // Check if multiple keys are pasted (contains newlines, commas, or semicolons)
      if (apiKey.includes('\n') || apiKey.includes(',') || apiKey.includes(';')) {
        await addMultipleApiKeys('openai', apiKey);
      } else {
        await addApiKey('openai', apiKey);
      }
      openaiKeyInput.value = '';
    }
  });
  
  addGeminiKey.addEventListener('click', async function() {
    const apiKey = geminiKeyInput.value.trim();
    if (apiKey) {
      // Check if multiple keys are pasted (contains newlines, commas, or semicolons)
      if (apiKey.includes('\n') || apiKey.includes(',') || apiKey.includes(';')) {
        await addMultipleApiKeys('gemini', apiKey);
      } else {
        await addApiKey('gemini', apiKey);
      }
      geminiKeyInput.value = '';
    }
  });
  
  // Global add key functionality
  const addGlobalKey = document.getElementById('addGlobalKey');
  const globalKeyInput = document.getElementById('globalKeyInput');
  
  if (addGlobalKey && globalKeyInput) {
    addGlobalKey.addEventListener('click', async function() {
      const apiKey = globalKeyInput.value.trim();
      if (apiKey) {
        // Check if multiple keys are pasted (contains newlines, commas, or semicolons)
        if (apiKey.includes('\n') || apiKey.includes(',') || apiKey.includes(';')) {
          await addMultipleApiKeys(currentProvider, apiKey);
        } else {
          await addApiKey(currentProvider, apiKey);
        }
        globalKeyInput.value = '';
      }
    });
    
    globalKeyInput.addEventListener('keydown', async function(e) {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        await addGlobalKey.click();
      }
    });
  }
  
  // Ctrl+Enter key support for API key textareas
  openaiKeyInput.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      await addOpenaiKey.click();
    }
  });
  
  geminiKeyInput.addEventListener('keydown', async function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      await addGeminiKey.click();
    }
  });
  
  // AI Settings Functions
  function updateProviderSelection() {
    if (currentProvider === 'openai') {
      openaiProvider.checked = true;
      geminiProvider.checked = false;
      // Always show OpenAI section when selected
      openaiSection.style.display = 'block';
      // Always hide Gemini section when OpenAI is selected
      geminiSection.style.display = 'none';
    } else {
      openaiProvider.checked = false;
      geminiProvider.checked = true;
      // Always hide OpenAI section when Gemini is selected
      openaiSection.style.display = 'none';
      // Always show Gemini section when selected
      geminiSection.style.display = 'block';
    }
    
    // Re-render keys for the selected provider
    renderApiKeys();
    
    // Show add key form when no keys exist for selected provider
    showAddKeyForm();
  }
  
  function showAddKeyForm() {
    const addKeyForm = document.getElementById('add-key-form');
    const openaiAddForm = document.querySelector('#openai-section .add-key-form');
    const geminiAddForm = document.querySelector('#gemini-section .add-key-form');
    
    if (addKeyForm) {
      // Show global add key form only if no keys exist for the selected provider
      if ((currentProvider === 'openai' && openaiKeys.length === 0) || 
          (currentProvider === 'gemini' && geminiKeys.length === 0)) {
        addKeyForm.style.display = 'block';
        
        // Hide provider-specific add forms when global form is shown
        if (openaiAddForm) openaiAddForm.style.display = 'none';
        if (geminiAddForm) geminiAddForm.style.display = 'none';
        
        // Update placeholder text based on selected provider
        const globalKeyInput = document.getElementById('globalKeyInput');
        if (globalKeyInput) {
          if (currentProvider === 'openai') {
            globalKeyInput.placeholder = 'Enter your OpenAI API key (or paste multiple keys)\nPress Ctrl+Enter to add';
          } else {
            globalKeyInput.placeholder = 'Enter your Gemini API key (or paste multiple keys)\nPress Ctrl+Enter to add';
          }
        }
      } else {
        addKeyForm.style.display = 'none';
        
        // Show provider-specific add forms when keys exist
        if (currentProvider === 'openai' && openaiAddForm) {
          openaiAddForm.style.display = 'flex';
        } else if (currentProvider === 'gemini' && geminiAddForm) {
          geminiAddForm.style.display = 'flex';
        }
      }
    }
  }
  
  async function addApiKey(provider, apiKey) {
    // Check for duplicate API keys
    const existingKeys = provider === 'openai' ? openaiKeys : geminiKeys;
    const isDuplicate = existingKeys.some(key => key.key === apiKey);
    
    if (isDuplicate) {
      showErrorMessage('This API key already exists!');
      return;
    }
    
    // Show loading state
    const addButton = provider === 'openai' ? document.getElementById('addOpenaiKey') : document.getElementById('addGeminiKey');
    const originalText = addButton.textContent;
    addButton.textContent = '⏳';
    addButton.disabled = true;
    
    try {
      // Test the API key first
      const isValid = await testApiKeyBeforeAdding(provider, apiKey);
      
      if (!isValid) {
        showErrorMessage('Invalid API key! Please check your key and try again.');
        return;
      }
      
      // Only add if the key is valid
      const keyId = Date.now().toString();
      const keyData = {
        id: keyId,
        key: apiKey,
        masked: apiKey.substring(0, 12) + '••••••••••••••••••••',
        status: 'valid',
        addedAt: new Date().toISOString(),
        usage: {
          requestsToday: 0,
          tokensToday: 0,
          lastReset: new Date().toDateString(),
          rateLimitReset: null,
          isRateLimited: false,
          costToday: 0
        }
      };
      
      if (provider === 'openai') {
        openaiKeys.push(keyData);
        if (!selectedOpenaiKey) {
          selectedOpenaiKey = keyId;
        }
      } else {
        geminiKeys.push(keyData);
        if (!selectedGeminiKey) {
          selectedGeminiKey = keyId;
        }
      }
      
      renderApiKeys();
      updateApiStats();
      saveAiSettings();
      showSuccessMessage('API key added and validated successfully!');
      
    } catch (error) {
      console.error('Error adding API key:', error);
      showErrorMessage('Failed to validate API key. Please check your key and try again.');
    } finally {
      // Reset button state
      addButton.textContent = originalText;
      addButton.disabled = false;
    }
  }

  async function addMultipleApiKeys(provider, apiKeysText) {
    // Parse multiple keys from text (split by newlines, commas, or spaces)
    const keys = apiKeysText
      .split(/[\n,;]/)
      .map(key => key.trim())
      .filter(key => key.length > 0);

    if (keys.length === 0) {
      showErrorMessage('No valid API keys found in the input!');
      return;
    }

    if (keys.length > 10) {
      showErrorMessage('Too many keys! Please add maximum 10 keys at once.');
      return;
    }

    // Show loading state
    const addButton = provider === 'openai' ? document.getElementById('addOpenaiKey') : document.getElementById('addGeminiKey');
    const originalText = addButton.textContent;
    addButton.textContent = `⏳ Adding ${keys.length} keys...`;
    addButton.disabled = true;

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      for (let i = 0; i < keys.length; i++) {
        const apiKey = keys[i];
        
        // Update progress
        addButton.textContent = `⏳ Validating ${i + 1}/${keys.length}...`;
        
        // Check for duplicates
        const existingKeys = provider === 'openai' ? openaiKeys : geminiKeys;
        const isDuplicate = existingKeys.some(key => key.key === apiKey);
        
        if (isDuplicate) {
          errors.push(`Key ${i + 1}: Already exists`);
          errorCount++;
          continue;
        }
    
    // Test the API key
        const isValid = await testApiKeyBeforeAdding(provider, apiKey);
        
        if (!isValid) {
          errors.push(`Key ${i + 1}: Invalid key`);
          errorCount++;
          continue;
        }

        // Add the valid key
        const keyId = Date.now().toString() + '_' + i;
        const keyData = {
          id: keyId,
          key: apiKey,
          masked: apiKey.substring(0, 12) + '••••••••••••••••••••',
          status: 'valid',
          addedAt: new Date().toISOString(),
          usage: {
            requestsToday: 0,
            tokensToday: 0,
            lastReset: new Date().toDateString(),
            rateLimitReset: null,
            isRateLimited: false,
            costToday: 0
          }
        };

        if (provider === 'openai') {
          openaiKeys.push(keyData);
          if (!selectedOpenaiKey) {
            selectedOpenaiKey = keyId;
          }
        } else {
          geminiKeys.push(keyData);
          if (!selectedGeminiKey) {
            selectedGeminiKey = keyId;
          }
        }
        
        successCount++;
      }

      // Update UI
      renderApiKeys();
      updateApiStats();
      saveAiSettings();

      // Show results
      if (successCount > 0 && errorCount === 0) {
        showSuccessMessage(`Successfully added ${successCount} API key${successCount > 1 ? 's' : ''}!`);
      } else if (successCount > 0 && errorCount > 0) {
        showErrorMessage(`Added ${successCount} key${successCount > 1 ? 's' : ''}, ${errorCount} failed. ${errors.join(', ')}`);
      } else {
        showErrorMessage(`Failed to add any keys. ${errors.join(', ')}`);
      }

    } catch (error) {
      console.error('Error adding multiple API keys:', error);
      showErrorMessage('Failed to add API keys. Please try again.');
    } finally {
      // Reset button state
      addButton.textContent = originalText;
      addButton.disabled = false;
    }
  }
  
  function removeApiKey(provider, keyId) {
    const keys = provider === 'openai' ? openaiKeys : geminiKeys;
    const keyToDelete = keys.find(key => key.id === keyId);
    
    if (!keyToDelete) return;
    
    // Show confirmation dialog
    if (confirm(`Are you sure you want to delete this API key?\n\n${keyToDelete.masked}`)) {
      if (provider === 'openai') {
        openaiKeys = openaiKeys.filter(key => key.id !== keyId);
        if (selectedOpenaiKey === keyId) {
          selectedOpenaiKey = openaiKeys.length > 0 ? openaiKeys[0].id : null;
        }
      } else {
        geminiKeys = geminiKeys.filter(key => key.id !== keyId);
        if (selectedGeminiKey === keyId) {
          selectedGeminiKey = geminiKeys.length > 0 ? geminiKeys[0].id : null;
        }
      }
      
      renderApiKeys();
      updateApiStats();
      saveAiSettings();
      showSuccessMessage('API key deleted successfully!');
    }
  }
  
  function selectApiKey(provider, keyId) {
    if (provider === 'openai') {
      selectedOpenaiKey = keyId;
    } else {
      selectedGeminiKey = keyId;
    }
    
    renderApiKeys();
    saveAiSettings();
  }
  
  function renderApiKeys() {
    // Only render keys for the currently selected provider
    if (currentProvider === 'openai') {
      // Render OpenAI keys
      if (openaiKeys.length === 0) {
        openaiKeysContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🔑</div>
            <div class="empty-text">No OpenAI keys added yet</div>
            <div class="empty-subtext">Add your OpenAI API key to enable GPT-4</div>
          </div>
        `;
      } else {
        openaiKeysContainer.innerHTML = openaiKeys.map(key => {
          const usage = key.usage || { requestsToday: 0, tokensToday: 0, isRateLimited: false };
          const statusClass = key.status === 'valid' ? (usage.isRateLimited ? 'rate-limited' : 'valid') : key.status;
          const statusText = usage.isRateLimited ? 'Rate Limited' : key.status;
          
          return `
            <div class="api-key-item ${selectedOpenaiKey === key.id ? 'selected' : ''}">
              <div class="api-key-info">
                <span class="api-key-masked">${key.masked}</span>
                <span class="api-key-status ${statusClass}">${statusText}</span>
                <div class="api-key-usage">
                  <span class="usage-item">Requests: ${usage.requestsToday}</span>
                  <span class="usage-item">Tokens: ${Math.round(usage.tokensToday/1000)}K</span>
                  <span class="usage-item cost-item">Cost: $${(usage.costToday || 0).toFixed(4)}</span>
                </div>
              </div>
              <div class="api-key-actions">
                <button class="api-key-btn select" data-action="select" data-provider="openai" data-key-id="${key.id}" title="Select this key">✓</button>
                <button class="api-key-btn delete" data-action="delete" data-provider="openai" data-key-id="${key.id}" title="Delete this key">🗑️</button>
              </div>
            </div>
          `;
        }).join('');
      }
    } else {
      // Render Gemini keys
      if (geminiKeys.length === 0) {
        geminiKeysContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✨</div>
            <div class="empty-text">No Gemini keys added yet</div>
          </div>
        `;
      } else {
        geminiKeysContainer.innerHTML = geminiKeys.map(key => {
          const usage = key.usage || { requestsToday: 0, tokensToday: 0, isRateLimited: false };
          const statusClass = key.status === 'valid' ? (usage.isRateLimited ? 'rate-limited' : 'valid') : key.status;
          const statusText = usage.isRateLimited ? 'Rate Limited' : key.status;
          
          return `
            <div class="api-key-item ${selectedGeminiKey === key.id ? 'selected' : ''}">
              <div class="api-key-info">
                <span class="api-key-masked">${key.masked}</span>
                <span class="api-key-status ${statusClass}">${statusText}</span>
                <div class="api-key-usage">
                  <span class="usage-item">Requests: ${usage.requestsToday}/250</span>
                  <span class="usage-item">Tokens: ${Math.round(usage.tokensToday/1000)}K/250K</span>
                  ${usage.requestsToday === 0 ? '<span class="usage-item fresh-key">🆕 Fresh</span>' : ''}
                </div>
              </div>
              <div class="api-key-actions">
                <button class="api-key-btn select" data-action="select" data-provider="gemini" data-key-id="${key.id}" title="Select this key">✓</button>
                <button class="api-key-btn delete" data-action="delete" data-provider="gemini" data-key-id="${key.id}" title="Delete this key">🗑️</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
    
    // Add event listeners for API key buttons
    setTimeout(() => {
      document.querySelectorAll('.api-key-btn').forEach(button => {
        button.addEventListener('click', function() {
          const action = this.getAttribute('data-action');
          const provider = this.getAttribute('data-provider');
          const keyId = this.getAttribute('data-key-id');
          
          if (action === 'select') {
            selectApiKey(provider, keyId);
          } else if (action === 'delete') {
            removeApiKey(provider, keyId);
            }
          });
        });
    }, 100);
  }
  
  function updateApiStats() {
    const totalKeysCount = openaiKeys.length + geminiKeys.length;
    const providerName = currentProvider === 'openai' ? 'OpenAI' : 'Google Gemini';
    
    // Count available keys (not rate limited)
    const availableKeys = currentProvider === 'openai' 
      ? openaiKeys.filter(key => !key.usage?.isRateLimited && key.status === 'valid').length
      : geminiKeys.filter(key => !key.usage?.isRateLimited && key.status === 'valid').length;
    
    // Calculate total daily capacity/cost for current provider
    let totalDailyCapacity = 0;
    let totalDailyCost = 0;
    
    if (currentProvider === 'openai') {
      // Calculate total cost for OpenAI keys
      totalDailyCost = openaiKeys.reduce((total, key) => {
        return total + (key.usage?.costToday || 0);
      }, 0);
      } else {
      totalDailyCapacity = availableKeys * 250; // 250 requests per Gemini key
    }
    
    activeProvider.textContent = providerName;
    totalKeys.textContent = totalKeysCount;
    
    // Update last used with capacity/cost info and timing recommendations
    if (availableKeys === 0) {
      lastUsed.textContent = 'All keys limited';
    } else if (currentProvider === 'openai') {
      lastUsed.textContent = `Cost: $${totalDailyCost.toFixed(4)} | Wait 1s between pages`;
    } else if (currentProvider === 'gemini') {
      const suggestedDelay = calculateSuggestedUrlDelay();
      lastUsed.textContent = `${availableKeys} keys = ${totalDailyCapacity} requests/day | Wait ${suggestedDelay}s between pages`;
    } else {
      lastUsed.textContent = 'Available';
    }
  }
  
  // Calculate suggested delay between opening URLs (same logic as content.js)
  function calculateSuggestedUrlDelay() {
    if (currentProvider !== 'gemini') {
      return 1; // 1 second for OpenAI
    }
    
    const geminiKeyCount = geminiKeys.filter(key => key.status === 'valid').length;
    
    if (geminiKeyCount <= 1) {
      return 6; // 6 seconds for single key
    }
    
    // Estimate user might open 30-60 job pages
    const estimatedPages = 45;
    
    // Calculate optimal delay: 60 seconds / estimated pages
    const totalTimeSeconds = 60;
    const delayPerPage = totalTimeSeconds / estimatedPages;
    
    // Adjust based on number of keys (more keys = can open faster)
    const adjustedDelay = delayPerPage / Math.sqrt(geminiKeyCount);
    
    // Minimum 1 second, maximum 10 seconds
    const finalDelay = Math.max(1, Math.min(10, adjustedDelay));
    
    return Math.round(finalDelay);
  }
  
  function getNextAvailableKey(provider) {
    const keys = provider === 'openai' ? openaiKeys : geminiKeys;
    
    if (provider === 'openai') {
      // For OpenAI: only check if key is valid (no rate limits)
      const availableKeys = keys.filter(key => key.status === 'valid');
      
      if (availableKeys.length === 0) {
        return null;
      }
      
      // Smart rotation: Use the key with the least usage today
      const keyWithLeastUsage = availableKeys.reduce((least, current) => {
        const leastUsage = least.usage?.requestsToday || 0;
        const currentUsage = current.usage?.requestsToday || 0;
        return currentUsage < leastUsage ? current : least;
      });
      
      return keyWithLeastUsage;
    } else {
      // For Gemini: check rate limits
      const availableKeys = keys.filter(key => 
        key.status === 'valid' && 
        !key.usage?.isRateLimited &&
        (key.usage?.requestsToday || 0) < 250 && (key.usage?.tokensToday || 0) < 250000
      );
      
      if (availableKeys.length === 0) {
        return null;
      }
      
      // Smart rotation: Use the key with the least usage today
      const keyWithLeastUsage = availableKeys.reduce((least, current) => {
        const leastUsage = least.usage?.requestsToday || 0;
        const currentUsage = current.usage?.requestsToday || 0;
        return currentUsage < leastUsage ? current : least;
      });
      
      return keyWithLeastUsage;
    }
  }
  
  function updateKeyUsage(provider, keyId, tokensUsed = 0) {
    const keys = provider === 'openai' ? openaiKeys : geminiKeys;
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
      if (provider === 'openai' && tokensUsed > 0) {
        // Estimate: assume 70% input tokens, 30% output tokens for job extraction
        const inputTokens = Math.round(tokensUsed * 0.7);
        const outputTokens = Math.round(tokensUsed * 0.3);
        const inputCost = (inputTokens / 1000) * 0.03;
        const outputCost = (outputTokens / 1000) * 0.06;
        const requestCost = inputCost + outputCost;
        
        key.usage.costToday = (key.usage.costToday || 0) + requestCost;
      }
      
      // Check if key is approaching limits (only for Gemini)
      if (provider === 'gemini') {
        const maxRequests = 250;
        const maxTokens = 250000;
        
        if (key.usage.requestsToday >= maxRequests || key.usage.tokensToday >= maxTokens) {
          key.usage.isRateLimited = true;
          key.usage.rateLimitReset = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        }
      }
      
      renderApiKeys();
      updateApiStats();
      saveAiSettings();
    }
  }
  
  function saveAiSettings() {
    chrome.storage.sync.set({
      aiProvider: currentProvider,
      openaiKeys: openaiKeys,
      geminiKeys: geminiKeys,
      selectedOpenaiKey: selectedOpenaiKey,
      selectedGeminiKey: selectedGeminiKey
    });
  }
  
  async function testApiKeyBeforeAdding(provider, apiKey) {
    try {
      let isValid = false;
      
      if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
        isValid = response.ok;
      } else {
        // Test Gemini API key
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        isValid = response.ok;
      }
      
      return isValid;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  async function testApiKey(provider, keyId) {
    const keys = provider === 'openai' ? openaiKeys : geminiKeys;
    const key = keys.find(k => k.id === keyId);
    if (!key) return;
    
    try {
      let isValid = false;
      
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${key.key}`
          }
        });
        isValid = response.ok;
      } else {
        // Test Gemini API key
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key.key}`);
        isValid = response.ok;
      }
      
      // Update key status
      key.status = isValid ? 'valid' : 'invalid';
      renderApiKeys();
      saveAiSettings();
      
    } catch (error) {
      key.status = 'invalid';
      renderApiKeys();
      saveAiSettings();
    }
  }
  
  // Add keyword with beautiful animation
  addButton.addEventListener('click', function() {
    const keyword = keywordInput.value.trim();
    const color = colorPicker.value;
    
    if (keyword) {
      chrome.storage.sync.get(['keywords'], function(result) {
        const keywords = result.keywords || [];
        
        // Check for case-insensitive duplicates
        const lowerCaseKeywords = keywords.map(k => k.text.toLowerCase());
        if (!lowerCaseKeywords.includes(keyword.toLowerCase())) {
          keywords.push({ text: keyword, color: color });
          chrome.storage.sync.set({keywords}, function() {
            keywordInput.value = '';
            renderKeywords(keywords);
            updateStats(keywords);
            
            // Success feedback
            showSuccessMessage('Keyword added successfully!');
            
            // Reset color picker to default
            colorPicker.value = '#FF6B6B';
          });
        } else {
          showErrorMessage('This keyword already exists!');
        }
      });
    } else {
      showErrorMessage('Please enter a keyword');
      keywordInput.focus();
    }
  });
  
  // Enter key support
  keywordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addButton.click();
    }
  });
  

  
  // Render keywords list with beautiful animations
  function renderKeywords(keywords) {
    if (keywords.length === 0) {
      keywordList.innerHTML = '<div class="empty-state">No keywords added yet<br>Start by adding your first keyword above!</div>';
      return;
    }
    
    keywordList.innerHTML = '';
    keywords.forEach((keywordObj, index) => {
      const item = document.createElement('div');
      item.className = 'keyword-item';
      item.style.animationDelay = `${index * 0.1}s`;
      
      // Capitalize first letter of keyword for better display
      const capitalizedKeyword = keywordObj.text.charAt(0).toUpperCase() + keywordObj.text.slice(1);
      
      item.innerHTML = `
        <div class="keyword-content">
          <div class="keyword-color" style="background-color: ${keywordObj.color}"></div>
          <div class="keyword-text">${escapeHtml(capitalizedKeyword)}</div>
        </div>
        <div class="keyword-controls">
          <input type="color" class="keyword-color-picker" value="${keywordObj.color}" data-index="${index}" title="Change color">
          <button class="delete-btn" data-index="${index}" title="Delete keyword">🗑️</button>
        </div>
      `;
      keywordList.appendChild(item);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        const keywordText = keywords[index].text;
        
        // Confirmation dialog
        if (confirm(`Are you sure you want to delete "${keywordText}"?`)) {
          chrome.storage.sync.get(['keywords'], function(result) {
            const keywords = [...result.keywords];
            keywords.splice(index, 1);
            chrome.storage.sync.set({keywords}, function() {
              renderKeywords(keywords);
              updateStats(keywords);
              showSuccessMessage('Keyword deleted successfully!');
            });
          });
        }
      });
    });
    
    // Add event listeners to color pickers
    document.querySelectorAll('.keyword-color-picker').forEach(colorPicker => {
      colorPicker.addEventListener('change', function() {
        const index = parseInt(this.getAttribute('data-index'));
        const newColor = this.value;
        
        chrome.storage.sync.get(['keywords'], function(result) {
          const keywords = [...result.keywords];
          keywords[index].color = newColor;
          chrome.storage.sync.set({keywords}, function() {
            // Update the color display immediately
            const keywordItem = colorPicker.closest('.keyword-item');
            const colorDisplay = keywordItem.querySelector('.keyword-color');
            colorDisplay.style.backgroundColor = newColor;
            
            // Send message to content script to update highlighting
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: 'updateKeywordColor',
                  keyword: keywords[index].text,
                  newColor: newColor
                });
              }
            });
            
            showSuccessMessage('Color updated successfully!');
          });
        });
      });
    });
  }
  
  // Update statistics
  function updateStats(keywords) {
    totalCount.textContent = keywords.length;
    
    // Get match count from current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getMatchCount'}, function(response) {
          if (response && response.totalMatches !== undefined) {
            matchCount.textContent = `${response.totalMatches} matches found`;
          } else {
            matchCount.textContent = '0 matches found';
          }
        });
      }
    });
  }
  
  // Show success message
  function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #48BB78;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.parentNode.removeChild(successDiv);
        }
      }, 300);
    }, 2000);
  }
  
  // Show error message
  function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #F56565;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      animation: slideInRight 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 300);
    }, 3000);
  }
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .keyword-item {
      animation: slideIn 0.3s ease-out forwards;
      opacity: 0;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
  
  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Add some nice hover effects for the color picker
  colorPicker.addEventListener('change', function() {
    // Add a subtle animation when color changes
    this.style.transform = 'scale(1.1)';
    setTimeout(() => {
      this.style.transform = 'scale(1)';
    }, 150);
  });
  
  // Focus management
  keywordInput.addEventListener('focus', function() {
    this.parentElement.style.transform = 'scale(1.02)';
  });
  
  keywordInput.addEventListener('blur', function() {
    this.parentElement.style.transform = 'scale(1)';
  });
});