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
  
  // API Key management elements
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKey');
  const syncApiKeyBtn = document.getElementById('syncApiKey');
  const editApiKeyBtn = document.getElementById('editApiKey');
  const apiStatus = document.getElementById('apiStatus');
  
  // Job Radar toggle element
  const jobRadarToggle = document.getElementById('jobRadarToggle');
  
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
  
  // Prevent API key copying
  apiKeyInput.addEventListener('copy', function(e) {
    e.preventDefault();
    showApiStatus('API key copying is disabled for security', 'error');
    return false;
  });
  
  apiKeyInput.addEventListener('cut', function(e) {
    e.preventDefault();
    showApiStatus('API key cutting is disabled for security', 'error');
    return false;
  });
  
  // Prevent drag selection
  apiKeyInput.addEventListener('mousedown', function(e) {
    if (e.button === 0) { // Left click
      this.setSelectionRange(0, 0); // Move cursor to start
    }
  });
  
  // Edit button functionality
  editApiKeyBtn.addEventListener('click', function() {
    enableApiKeyEditing();
  });
  
  // Monitor input changes to enable/disable buttons
  apiKeyInput.addEventListener('input', function() {
    const hasValue = this.value.trim().length > 0;
    saveApiKeyBtn.disabled = !hasValue;
    syncApiKeyBtn.disabled = !hasValue;
  });
  
  // Disable API key input when key is saved
  function disableApiKeyInput(apiKey) {
    if (apiKey && apiKey.length > 4) {
      const masked = apiKey.substring(0, 4) + '••••••••••••••••••••';
      apiKeyInput.value = masked;
      apiKeyInput.disabled = true;
      apiKeyInput.classList.add('disabled');
      editApiKeyBtn.style.display = 'inline-block';
      saveApiKeyBtn.style.display = 'none';
      syncApiKeyBtn.style.display = 'none';
    }
  }
  
  // Enable API key editing
  function enableApiKeyEditing() {
    // Clear the input and enable editing
    apiKeyInput.value = '';
    apiKeyInput.disabled = false;
    apiKeyInput.classList.remove('disabled');
    editApiKeyBtn.style.display = 'none';
    saveApiKeyBtn.style.display = 'inline-block';
    syncApiKeyBtn.style.display = 'inline-block';
    
    // Disable buttons initially since input is empty
    saveApiKeyBtn.disabled = true;
    syncApiKeyBtn.disabled = true;
    
    apiKeyInput.focus();
  }
  
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
      // Open each URL in a new tab
      for (const url of urls) {
        await chrome.tabs.create({ url: url, active: false });
        // Small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      showUrlStatus(`Successfully opened ${urls.length} URL(s) in new tabs! Popup will close in 1 second...`, 'success');
      urlTextarea.value = ''; // Clear the textarea after successful opening
      
      // Close the popup after successfully opening URLs
      setTimeout(() => {
        window.close();
      }, 1000); // Small delay to show success message before closing
      
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
  chrome.storage.sync.get(['keywords', 'openaiApiKey', 'jobRadarEnabled'], function(result) {
    let keywords = result.keywords;
    
    // Initialize with default keywords if none exist
    if (!keywords || keywords.length === 0) {
      keywords = defaultKeywords;
      chrome.storage.sync.set({keywords: defaultKeywords});
    }
    
    renderKeywords(keywords);
    updateStats(keywords);
    
    // Load saved API key
    if (result.openaiApiKey) {
      disableApiKeyInput(result.openaiApiKey);
      validateApiKeyInput(result.openaiApiKey);
    }
    
    // Load Job Radar toggle state (default to enabled)
    const isEnabled = result.jobRadarEnabled !== false; // Default to true if not set
    jobRadarToggle.checked = isEnabled;
    
    // Update all tabs with the current state
    updateJobRadarState(isEnabled);
  });
  
  // API Key management
  saveApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (apiKey) {
      chrome.storage.sync.set({openaiApiKey: apiKey}, function() {
        showApiStatus('API key saved successfully!', 'success');
        validateApiKeyInput(apiKey);
        
        // Update config in content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'updateApiKey',
              apiKey: apiKey
            });
          }
        });
      });
    } else {
      showApiStatus('Please enter an API key', 'error');
    }
  });
  
  syncApiKeyBtn.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showApiStatus('Please enter an API key first', 'error');
      return;
    }
    
    // Disable button and show loading
    syncApiKeyBtn.disabled = true;
    showApiStatus('Testing API key...', 'loading');
    
    // Test the API key
    testApiKey(apiKey).then(isValid => {
      if (isValid) {
        showApiStatus('✅ API key is valid and working!', 'success');
        validateApiKeyInput(apiKey);
        
        // Save the key if it's valid
        chrome.storage.sync.set({openaiApiKey: apiKey}, function() {
          // Disable the input form after successful sync
          disableApiKeyInput(apiKey);
          
          // Update config in content script
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateApiKey',
                apiKey: apiKey
              });
            }
          });
        });
      } else {
        showApiStatus('❌ Invalid API key. Please check and try again.', 'error');
        invalidateApiKeyInput();
      }
    }).catch(error => {
      showApiStatus('❌ Error testing API key: ' + error.message, 'error');
      invalidateApiKeyInput();
    }).finally(() => {
      syncApiKeyBtn.disabled = false;
    });
  });
  
  // Test API key with OpenAI
  async function testApiKey(apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data && data.data.length > 0;
      } else if (response.status === 401) {
        throw new Error('Invalid API key');
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      throw error;
    }
  }
  
  // Show API status message
  function showApiStatus(message, type) {
    apiStatus.textContent = message;
    apiStatus.className = `api-status ${type}`;
    apiStatus.style.display = 'block';
    
    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        apiStatus.style.display = 'none';
      }, 3000);
    }
  }
  
  // Validate API key input styling
  function validateApiKeyInput(apiKey) {
    apiKeyInput.classList.remove('invalid');
    apiKeyInput.classList.add('valid');
  }
  
  // Invalidate API key input styling
  function invalidateApiKeyInput() {
    apiKeyInput.classList.remove('valid');
    apiKeyInput.classList.add('invalid');
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
  
  // Enter key support for API key input
  apiKeyInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      saveApiKeyBtn.click();
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