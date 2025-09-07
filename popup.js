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
  // Cover Letter toggle element
  const coverLetterToggle = document.getElementById('coverLetterToggle');
  // AI Analysis toggle element
  const aiAnalysisToggle = document.getElementById('aiAnalysisToggle');
  // Copy preferences elements
  const copyIncludeIndustry = document.getElementById('copyIncludeIndustry');
  const copyIncludeCompanySize = document.getElementById('copyIncludeCompanySize');
  const copyIncludeFoundedDate = document.getElementById('copyIncludeFoundedDate');
  const copyIncludeTechStack = document.getElementById('copyIncludeTechStack');
  const copyIncludeMatchRate = document.getElementById('copyIncludeMatchRate');
  const copyIncludeSalary = document.getElementById('copyIncludeSalary');
  
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
  
  // Cover Letter toggle functionality
  coverLetterToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    
    // Save the state
    chrome.storage.sync.set({coverLetterEnabled: isEnabled}, function() {
      // Update all tabs with the new state
      updateCoverLetterState(isEnabled);
      
      // Show feedback
      if (isEnabled) {
        showSuccessMessage('Cover Letter generation enabled!');
      } else {
        showSuccessMessage('Cover Letter generation disabled!');
      }
    });
  });

  // AI Analysis toggle functionality
  aiAnalysisToggle.addEventListener('change', function() {
    const isEnabled = this.checked;
    console.log('AI Analysis toggle changed to:', isEnabled);
    
    // Save the state
    chrome.storage.sync.set({aiAnalysisEnabled: isEnabled}, function() {
      console.log('AI Analysis state saved to storage:', isEnabled);
      // Update all tabs with the new state
      updateAiAnalysisState(isEnabled);
      
      // Show feedback
      if (isEnabled) {
        showSuccessMessage('AI Analysis enabled!');
      } else {
        showSuccessMessage('AI Analysis disabled!');
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
  
  // Function to update Cover Letter state across all tabs
  function updateCoverLetterState(isEnabled) {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateCoverLetterState',
          enabled: isEnabled
        }).catch(() => {
          // Ignore errors for tabs that don't have the content script
        });
      });
    });
  }

  // Function to update AI Analysis state across all tabs
  function updateAiAnalysisState(isEnabled) {
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateAiAnalysisState',
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
  // Sheets tab elements
  const sheetUrlInput = document.getElementById('sheetUrl');
  const sheetNameInput = document.getElementById('sheetName');
  const todoSheetUrlInput = document.getElementById('todoSheetUrl');
  const urlCheckSheetUrlInput = document.getElementById('urlCheckSheetUrl');
  const googleClientIdInput = document.getElementById('googleClientId');
  const googleSignInBtn = document.getElementById('googleSignIn');
  const googleAuthStatus = document.getElementById('googleAuthStatus');
  const testSheetsSyncBtn = document.getElementById('testSheetsSync');
  const testSheetsWriteBtn = document.getElementById('testSheetsWrite');
  const sheetsStatus = document.getElementById('sheetsStatus');
  
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

  // ---- Google Sheets Integration ----
  function showSheetsStatus(message, type) {
    if (!sheetsStatus) return;
    sheetsStatus.textContent = message;
    sheetsStatus.className = `api-status ${type}`;
    sheetsStatus.style.display = 'block';
  }

  function extractSheetInfo(sheetUrl) {
    try {
      const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      const sheetId = idMatch ? idMatch[1] : null;
      let gid = null;
      try {
        const u = new URL(sheetUrl);
        if (u.hash) {
          const params = new URLSearchParams(u.hash.replace(/^#/, ''));
          const gidStr = params.get('gid');
          if (gidStr && /^\d+$/.test(gidStr)) gid = parseInt(gidStr, 10);
        }
      } catch (_) {}
      return { sheetId, gid };
    } catch (_) { return { sheetId: null, gid: null }; }
  }

  // Debounce helper for auto-save
  function debounce(fn, delay) {
    let timerId;
    return function(...args) {
      clearTimeout(timerId);
      timerId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  const autoSaveSheetsCfg = debounce(() => {
    const payload = {
      todoSheetUrl: todoSheetUrlInput?.value?.trim() || '',
      urlCheckSheetUrl: urlCheckSheetUrlInput?.value?.trim() || '',
      googleClientId: googleClientIdInput?.value?.trim() || ''
    };
    chrome.storage.sync.set(payload, () => {
      if (!chrome.runtime.lastError) {
        showSheetsStatus('Settings saved', 'success');
      }
    });
  }, 400);

  // Load saved Sheets config
  chrome.storage.sync.get(['todoSheetUrl', 'urlCheckSheetUrl', 'googleClientId'], (cfg) => {
    if (todoSheetUrlInput && cfg.todoSheetUrl) todoSheetUrlInput.value = cfg.todoSheetUrl;
    if (urlCheckSheetUrlInput && cfg.urlCheckSheetUrl) urlCheckSheetUrlInput.value = cfg.urlCheckSheetUrl;
    if (googleClientIdInput && cfg.googleClientId) googleClientIdInput.value = cfg.googleClientId;
  });
  
  // Load OAuth token from local storage (more secure and persistent)
  chrome.storage.local.get(['googleAccessToken', 'googleTokenExpiry'], (cfg) => {
    if (googleAuthStatus && cfg.googleAccessToken && cfg.googleTokenExpiry && Date.now() < cfg.googleTokenExpiry - 30000) {
      googleAuthStatus.textContent = '✅';
    }
  });

  // Removed explicit Save; auto-save is active on input/paste

  // Auto-save on input/paste
  if (todoSheetUrlInput) {
    todoSheetUrlInput.addEventListener('input', autoSaveSheetsCfg);
    todoSheetUrlInput.addEventListener('paste', () => setTimeout(autoSaveSheetsCfg, 0));
  }
  if (urlCheckSheetUrlInput) {
    urlCheckSheetUrlInput.addEventListener('input', autoSaveSheetsCfg);
    urlCheckSheetUrlInput.addEventListener('paste', () => setTimeout(autoSaveSheetsCfg, 0));
  }
  if (googleClientIdInput) {
    googleClientIdInput.addEventListener('input', autoSaveSheetsCfg);
    googleClientIdInput.addEventListener('paste', () => setTimeout(autoSaveSheetsCfg, 0));
  }

  // OAuth sign-in
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      console.log('Google Sign-In button clicked');
      const clientId = googleClientIdInput?.value?.trim();
      if (!clientId) {
        showSheetsStatus('Enter your Google Client ID', 'error');
        return;
      }
      try {
        // Button loading state
        const originalText = googleSignInBtn.textContent;
        googleSignInBtn.textContent = 'Signing in...';
        googleSignInBtn.disabled = true;
        const redirectUri = `https://${chrome.runtime.id}.chromiumapp.org/`;
        const scope = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets');
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&prompt=consent`;
        const responseUrl = await new Promise((resolve, reject) => {
          chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (redirectedTo) => {
            if (chrome.runtime.lastError) {
              console.error('launchWebAuthFlow error:', chrome.runtime.lastError);
              return reject(new Error(chrome.runtime.lastError.message));
            }
            if (!redirectedTo) return reject(new Error('No redirect'));
            resolve(redirectedTo);
          });
        });
        const hash = new URL(responseUrl).hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const expiresInSec = parseInt(params.get('expires_in') || '0', 10);
        if (!accessToken) throw new Error('No access token');
        const expiryTs = Date.now() + (expiresInSec * 1000);
        chrome.storage.local.set({ googleAccessToken: accessToken, googleTokenExpiry: expiryTs }, () => {
          showSheetsStatus('Signed in. Token stored persistently.', 'success');
          if (googleAuthStatus) googleAuthStatus.textContent = '✅';
        });
        // restore button
        googleSignInBtn.textContent = originalText;
        googleSignInBtn.disabled = false;
      } catch (e) {
        console.error('OAuth failed:', e);
        showSheetsStatus('Sign-in failed', 'error');
        if (googleAuthStatus) googleAuthStatus.textContent = '❌';
        try {
          googleSignInBtn.textContent = 'Sign in with Google';
          googleSignInBtn.disabled = false;
        } catch (_) {}
      }
    });
  }

  async function getValidAccessToken() {
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

  // Setup Sync test for specific input/button pair
  function setupSyncTest(buttonEl, inputEl) {
    if (!buttonEl) return;
    buttonEl.addEventListener('click', async () => {
      const sheetUrl = inputEl?.value?.trim();
      if (!sheetUrl) { showSheetsStatus('Enter a Google Sheet URL first', 'error'); return; }
      const { sheetId, gid } = extractSheetInfo(sheetUrl);
      if (!sheetId) { showSheetsStatus('Invalid Sheet URL', 'error'); return; }
      showSheetsStatus('Testing read access...', 'loading');
      try {
        const csvUrl = gid != null
          ? `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
          : `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=Sheet1`;
        const resp = await fetch(csvUrl, { method: 'GET' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const text = await resp.text();
        const preview = text.split('\n').slice(0, 3).join('\n');
        console.log('Sheets CSV preview:', preview);
        showSheetsStatus('Read test OK (published CSV). Writing needs OAuth.', 'success');
      } catch (err) {
        console.error('Sheets read test failed:', err);
        showSheetsStatus('Read test failed. Ensure the sheet is published or public.', 'error');
      }
    });
  }

  setupSyncTest(document.getElementById('testTodoSync'), document.getElementById('todoSheetUrl'));
  setupSyncTest(document.getElementById('testUrlCheckSync'), document.getElementById('urlCheckSheetUrl'));

  // ---- Auto Check pipeline helpers ----
  async function fetchRows(sheetUrl) {
    const { sheetId, gid } = extractSheetInfo(sheetUrl);
    if (!sheetId) throw new Error('Invalid sheet URL');
    const token = await getValidAccessToken();
    if (!token) throw new Error('Not signed in');
    // Resolve title
    let sheetName = gid != null ? await getSheetTitleByGid(sheetId, gid, token) : null;
    if (!sheetName) sheetName = await getFirstSheetTitle(sheetId, token);
    const range = `${sheetName}!A:G`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) throw new Error(`Read HTTP ${resp.status}`);
    const data = await resp.json();
    return { sheetId, sheetName, token, values: data.values || [] };
  }

  async function writeRow(sheetId, sheetName, token, rowIndex, rowValues) {
    const range = `${sheetName}!A${rowIndex}:G${rowIndex}`;
    const body = { range, majorDimension: 'ROWS', values: [rowValues] };
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!resp.ok) throw new Error(`Write HTTP ${resp.status}`);
  }

  async function colorCell(sheetId, sheetName, token, rowIndex, colIndex, isGreen) {
    // get numeric sheetId for formatting
    const metaResp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title))`, { headers: { Authorization: `Bearer ${token}` } });
    const meta = await metaResp.json();
    const sh = (meta.sheets || []).find(s => s.properties && s.properties.title === sheetName);
    const numericId = sh?.properties?.sheetId;
    if (numericId == null) return;
    const rgb = isGreen ? { red: 0.8, green: 0.95, blue: 0.8 } : { red: 0.98, green: 0.85, blue: 0.85 };
    const req = {
      repeatCell: {
        range: { sheetId: numericId, startRowIndex: rowIndex - 1, endRowIndex: rowIndex, startColumnIndex: colIndex - 1, endColumnIndex: colIndex },
        cell: { userEnteredFormat: { backgroundColor: rgb } },
        fields: 'userEnteredFormat.backgroundColor'
      }
    };
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ requests: [req] })
    });
  }

  async function openAndAnalyze(url) {
    // Open via background; placeholder analysis delay
    await chrome.runtime.sendMessage({ action: 'openUrlsInBackground', urls: [url] });
    // TODO: integrate with content.js to return real jobInfo
    return new Promise((resolve) => setTimeout(() => resolve({ company: '', position: '', industry: '', jobType: '' }), 3000));
  }

  const startAutoCheckBtn = document.getElementById('startAutoCheck');
  if (startAutoCheckBtn) {
    // Initialize button state from background
    chrome.runtime.sendMessage({ action: 'getAutoCheckStatus' }, (resp) => {
      if (resp && resp.running) {
        startAutoCheckBtn.dataset.state = 'running';
        startAutoCheckBtn.textContent = 'Stop Auto-check';
      } else {
        startAutoCheckBtn.dataset.state = 'stopped';
        startAutoCheckBtn.textContent = 'Start Auto-check';
      }
    });
    startAutoCheckBtn.addEventListener('click', async () => {
      try {
        const isStopping = startAutoCheckBtn.dataset.state === 'running';
        const sheetUrl = document.getElementById('urlCheckSheetUrl')?.value?.trim();
        if (!sheetUrl) { showSheetsStatus('Enter URL Auto-check Sheet URL', 'error'); return; }

        if (isStopping) {
          await chrome.runtime.sendMessage({ action: 'stopAutoCheck' });
          startAutoCheckBtn.dataset.state = 'stopped';
          startAutoCheckBtn.textContent = 'Start Auto-check';
          showSheetsStatus('Stopping...', 'info');
          return;
        }

        showSheetsStatus('Starting auto-check in background...', 'loading');
        startAutoCheckBtn.dataset.state = 'running';
        startAutoCheckBtn.textContent = 'Stop Auto-check';
        chrome.runtime.sendMessage({ action: 'startAutoCheck', sheetUrl }, (resp) => {
          if (resp && resp.ok && resp.done) {
            startAutoCheckBtn.dataset.state = 'stopped';
            startAutoCheckBtn.textContent = 'Start Auto-check';
            showSheetsStatus('Auto-check completed', 'success');
          }
        });
      } catch (e) {
        console.error('Auto-check failed:', e);
        showSheetsStatus('Auto-check failed. See console.', 'error');
        startAutoCheckBtn.dataset.state = 'stopped';
        startAutoCheckBtn.textContent = 'Start Auto-check';
      }
    });
  }
  async function getFirstSheetTitle(sheetId, token) {
    const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(title))`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error(`Meta HTTP ${resp.status}`);
    const data = await resp.json();
    return data.sheets?.[0]?.properties?.title || 'Sheet1';
  }

  async function getSheetTitleByGid(sheetId, gid, token) {
    const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets(properties(sheetId,title))`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error(`Meta HTTP ${resp.status}`);
    const data = await resp.json();
    const found = (data.sheets || []).find(s => s.properties && s.properties.sheetId === gid);
    return found?.properties?.title || null;
  }

  function setupWriteTest(buttonEl, inputEl, defaultSheetName) {
    if (!buttonEl) return;
    buttonEl.addEventListener('click', async () => {
      const sheetUrl = inputEl?.value?.trim();
      if (!sheetUrl) { showSheetsStatus('Enter a Google Sheet URL', 'error'); return; }
      const { sheetId, gid } = extractSheetInfo(sheetUrl);
      if (!sheetId) { showSheetsStatus('Invalid Sheet URL', 'error'); return; }
      const token = await getValidAccessToken();
      if (!token) { showSheetsStatus('Sign in first', 'error'); return; }
      showSheetsStatus('Testing write (append)...', 'loading');
      try {
        // Prefer target tab by gid or provided name; otherwise use first tab
        let sheetName = null;
        if (gid != null) {
          sheetName = await getSheetTitleByGid(sheetId, gid, token);
        }
        if (!sheetName) sheetName = defaultSheetName || await getFirstSheetTitle(sheetId, token);
        const body = {
          range: `${sheetName}!A1`,
          majorDimension: 'ROWS',
          values: [[new Date().toISOString(), 'AI Job Radar', 'Write test OK']]
        };
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          console.error('Sheets write error:', resp.status, errText);
          if (resp.status === 401) {
            showSheetsStatus('401 Unauthorized. Please sign in again.', 'error');
          } else if (resp.status === 403) {
            showSheetsStatus('403 Forbidden. Ensure the signed-in account has Editor access.', 'error');
          } else if (resp.status === 404) {
            showSheetsStatus('404 Not found. Check the Sheet URL/ID.', 'error');
          } else {
            showSheetsStatus(`Write failed (HTTP ${resp.status}). See console for details.`, 'error');
          }
          return;
        }
        showSheetsStatus('Write test OK (row appended)', 'success');
      } catch (e) {
        console.error('Sheets write failed:', e);
        showSheetsStatus('Write test failed. Ensure edit access.', 'error');
      }
    });
  }

  // If you name your tabs exactly 'To-Do' and 'URL Auto-check', we'll target them.
  setupWriteTest(document.getElementById('testTodoWrite'), document.getElementById('todoSheetUrl'), 'To-Do');
  setupWriteTest(document.getElementById('testUrlCheckWrite'), document.getElementById('urlCheckSheetUrl'), 'URL Auto-check');
  
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
  
  // Load API keys from background script (which has access to Chrome storage)
  async function loadApiKeysFromStorage() {
    try {
      console.log('🔄 Popup: Requesting API keys from background script...');
      
      // Request API keys from background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getApiKeys' }, (response) => {
          console.log('🔄 Popup: Received response from background:', response);
          resolve(response);
        });
      });
      
      if (response && response.success) {
        console.log('✅ Popup: Loaded API keys from background script:', {
          openai: response.openaiKeys?.length || 0,
          gemini: response.geminiKeys?.length || 0,
          openaiKeys: response.openaiKeys?.map(k => ({ id: k.id, masked: k.masked })) || [],
          geminiKeys: response.geminiKeys?.map(k => ({ id: k.id, masked: k.masked })) || []
        });
        
        return {
          openaiKeys: response.openaiKeys || [],
          geminiKeys: response.geminiKeys || []
        };
      } else {
        console.log('⚠️ Popup: No API keys found in background script, response:', response);
        return { openaiKeys: [], geminiKeys: [] };
      }
    } catch (error) {
      console.error('❌ Popup: Error loading API keys from background script:', error);
      return { openaiKeys: [], geminiKeys: [] };
    }
  }

  // Removed legacy localStorage manager and migration; using background chrome.storage.local only.

  // Check storage quota and provide helpful error messages
  async function checkStorageQuota() {
    try {
      const quota = await chrome.storage.local.getBytesInUse();
      const maxQuota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default
      const usagePercent = (quota / maxQuota) * 100;
      
      console.log(`Storage usage: ${quota} bytes (${usagePercent.toFixed(1)}% of ${maxQuota} bytes)`);
      
      if (usagePercent > 80) {
        console.warn('Storage quota is getting high:', usagePercent.toFixed(1) + '%');
        return { warning: true, usage: usagePercent };
      }
      
      return { warning: false, usage: usagePercent };
    } catch (error) {
      console.error('Error checking storage quota:', error);
      return { warning: false, usage: 0 };
    }
  }
  
  // Load settings from storage
  chrome.storage.sync.get(['keywords', 'aiProvider', 'selectedOpenaiKey', 'selectedGeminiKey', 'openaiApiKey', 'jobRadarEnabled', 'coverLetterEnabled', 'aiAnalysisEnabled', 'copyIncludeIndustry', 'copyIncludeCompanySize', 'copyIncludeFoundedDate', 'copyIncludeTechStack', 'copyIncludeMatchRate', 'copyIncludeSalary'], async function(result) {
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
    
    // Load API keys from background (chrome.storage.local)
    const apiKeysData = await loadApiKeysFromStorage();
    openaiKeys = apiKeysData.openaiKeys;
    geminiKeys = apiKeysData.geminiKeys;
    
    // Debug: Log what we loaded
    console.log('Popup loaded API keys from background storage:', {
      openai: openaiKeys.length,
      gemini: geminiKeys.length,
      openaiKeys: openaiKeys.map(k => ({ id: k.id, status: k.status, masked: k.masked })),
      geminiKeys: geminiKeys.map(k => ({ id: k.id, status: k.status, masked: k.masked }))
    });
    
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
    
    // Load Cover Letter toggle state (default to disabled)
    const coverLetterEnabled = result.coverLetterEnabled === true; // Default to false if not set
    coverLetterToggle.checked = coverLetterEnabled;
    
    // Update all tabs with the current cover letter state
    updateCoverLetterState(coverLetterEnabled);

    // Load AI Analysis toggle state (default to enabled)
    console.log('Loading AI Analysis state from storage:', result.aiAnalysisEnabled);
    const aiAnalysisEnabled = result.aiAnalysisEnabled !== undefined ? result.aiAnalysisEnabled : true; // Default to true if not set
    console.log('Setting AI Analysis toggle to:', aiAnalysisEnabled);
    aiAnalysisToggle.checked = aiAnalysisEnabled;
    
    // Update all tabs with the current AI analysis state
    updateAiAnalysisState(aiAnalysisEnabled);

    // Initialize copy preferences (defaults false)
    console.log('🔧 Loading copy preferences:', {
      copyIncludeIndustry: result.copyIncludeIndustry,
      copyIncludeCompanySize: result.copyIncludeCompanySize,
      copyIncludeFoundedDate: result.copyIncludeFoundedDate,
      copyIncludeTechStack: result.copyIncludeTechStack,
      copyIncludeMatchRate: result.copyIncludeMatchRate,
      copyIncludeSalary: result.copyIncludeSalary
    });
    copyIncludeIndustry.checked = result.copyIncludeIndustry === true;
    copyIncludeCompanySize.checked = result.copyIncludeCompanySize === true;
    copyIncludeFoundedDate.checked = result.copyIncludeFoundedDate === true;
    copyIncludeTechStack.checked = result.copyIncludeTechStack === true;
    copyIncludeMatchRate.checked = result.copyIncludeMatchRate === true;
    copyIncludeSalary.checked = result.copyIncludeSalary === true;
  });

  // Persist copy preferences
  function saveCopyPrefs() {
    const payload = {
      copyIncludeIndustry: copyIncludeIndustry?.checked === true,
      copyIncludeCompanySize: copyIncludeCompanySize?.checked === true,
      copyIncludeFoundedDate: copyIncludeFoundedDate?.checked === true,
      copyIncludeTechStack: copyIncludeTechStack?.checked === true,
      copyIncludeMatchRate: copyIncludeMatchRate?.checked === true,
      copyIncludeSalary: copyIncludeSalary?.checked === true
    };
    console.log('🔧 Saving copy preferences:', payload);
    chrome.storage.sync.set(payload, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save copy preferences:', chrome.runtime.lastError);
      } else {
        console.log('✅ Copy preferences saved');
      }
    });
  }

  copyIncludeIndustry && copyIncludeIndustry.addEventListener('change', saveCopyPrefs);
  copyIncludeCompanySize && copyIncludeCompanySize.addEventListener('change', saveCopyPrefs);
  copyIncludeFoundedDate && copyIncludeFoundedDate.addEventListener('change', saveCopyPrefs);
  copyIncludeTechStack && copyIncludeTechStack.addEventListener('change', saveCopyPrefs);
  copyIncludeMatchRate && copyIncludeMatchRate.addEventListener('change', saveCopyPrefs);
  copyIncludeSalary && copyIncludeSalary.addEventListener('change', saveCopyPrefs);
  
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
            globalKeyInput.placeholder = 'Enter your OpenAI API keys';
          } else {
            globalKeyInput.placeholder = 'Enter your Gemini API keys';
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
    
    console.log(`🔄 Popup: Starting batch processing of ${keys.length} ${provider} keys`);
    
    // Show loading state with progress
    const addButton = provider === 'openai' ? document.getElementById('addOpenaiKey') : document.getElementById('addGeminiKey');
    const originalText = addButton.textContent;
    addButton.textContent = `⏳ Processing ${keys.length} keys...`;
    addButton.disabled = true;
    
    // Create progress indicator
    const progressDiv = document.createElement('div');
    progressDiv.id = 'apiKeyProgress';
    progressDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #007bff;
      border-radius: 8px;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      text-align: center;
      min-width: 300px;
    `;
    progressDiv.innerHTML = `
      <h3>Processing API Keys</h3>
      <div style="margin: 10px 0;">
        <div style="background: #f0f0f0; border-radius: 10px; height: 20px; overflow: hidden;">
          <div id="progressBar" style="background: #007bff; height: 100%; width: 0%; transition: width 0.3s;"></div>
        </div>
        <div id="progressText" style="margin-top: 5px; font-size: 14px;">Starting...</div>
      </div>
      <div id="progressStats" style="font-size: 12px; color: #666;"></div>
    `;
    document.body.appendChild(progressDiv);
    
    try {
      // Listen for progress updates
      const progressListener = (message) => {
        if (message.action === 'apiKeyProgress') {
          const progressBar = document.getElementById('progressBar');
          const progressText = document.getElementById('progressText');
          const progressStats = document.getElementById('progressStats');
          
          if (progressBar && progressText && progressStats) {
            progressBar.style.width = `${message.progress}%`;
            progressText.textContent = `Processing ${message.current}/${message.total} keys...`;
            progressStats.textContent = `Valid: ${message.valid} | Invalid: ${message.invalid}`;
          }
        }
      };
      
      chrome.runtime.onMessage.addListener(progressListener);
      
      // Send keys to background for processing
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'processApiKeysInBackground',
          provider: provider,
          apiKeys: keys,
          progressCallback: true
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      // Remove progress listener
      chrome.runtime.onMessage.removeListener(progressListener);
      
      if (response.status === 'complete') {
        const { results, summary } = response;
        console.log('✅ Popup: Background processing complete:', summary);
        
        // Check for duplicates and prepare keys for storage
        const existingKeys = provider === 'openai' ? openaiKeys : geminiKeys;
        let addedCount = 0;
        let duplicateCount = 0;
        const keysToSave = [];
        
        console.log(`🔄 Popup: Processing ${results.valid.length} valid keys, checking for duplicates...`);
        
        for (const validKey of results.valid) {
          const isDuplicate = existingKeys.some(key => key.key === validKey);
          if (!isDuplicate) {
            const keyId = Date.now().toString() + '_' + addedCount;
            const keyData = {
              id: keyId,
              key: validKey,
              masked: validKey.substring(0, 12) + '••••••••••••••••••••',
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
            keysToSave.push(keyData);
            addedCount++;
          } else {
            duplicateCount++;
          }
        }
        
                // Save to background storage if we have keys to save
        if (keysToSave.length > 0) {
          console.log(`Saving ${keysToSave.length} ${provider} keys to background storage...`);
          try {
            // Add keys to local arrays first
            if (provider === 'openai') {
              openaiKeys.push(...keysToSave);
            } else {
              geminiKeys.push(...keysToSave);
            }
            
            // Save through the new saveApiKeys handler
            const saveResponse = await new Promise((resolve, reject) => {
              chrome.runtime.sendMessage({
                action: 'saveApiKeys',
                openaiKeys: provider === 'openai' ? openaiKeys : [],
                geminiKeys: provider === 'gemini' ? geminiKeys : []
              }, (response) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(response);
                }
              });
            });
            console.log('Save response from background:', saveResponse);
          } catch (error) {
            console.error('Failed to save keys to background storage:', error);
          }
        }
        
        // Update UI with the new keys
        console.log('Updating UI with new keys...');
        renderApiKeys();
        updateApiStats();
        
        // Update progress display with final results
        const progressText = document.getElementById('progressText');
        const progressStats = document.getElementById('progressStats');
        if (progressText && progressStats) {
          progressText.textContent = 'Processing complete!';
          progressStats.innerHTML = `
            <div style="color: #28a745;">✅ Added: ${addedCount}</div>
            <div style="color: #dc3545;">❌ Invalid: ${summary.invalid}</div>
            ${duplicateCount > 0 ? `<div style="color: #ffc107;">⚠️ Duplicates: ${duplicateCount}</div>` : ''}
            ${summary.errors > 0 ? `<div style="color: #ffc107;">⚠️ Errors: ${summary.errors}</div>` : ''}
          `;
        }
        
        // Show summary message
        if (addedCount > 0) {
          showSuccessMessage(`Successfully added ${addedCount} valid ${provider} API keys!`);
        }
        if (summary.invalid > 0) {
          showErrorMessage(`${summary.invalid} invalid keys were skipped.`);
        }
        if (duplicateCount > 0) {
          showErrorMessage(`${duplicateCount} duplicate keys were skipped.`);
        }
        if (summary.errors > 0) {
          showErrorMessage(`${summary.errors} keys had errors during processing.`);
        }
        
        // Auto-close progress dialog after 3 seconds
        setTimeout(() => {
          const progressDiv = document.getElementById('apiKeyProgress');
          if (progressDiv) {
            progressDiv.remove();
          }
        }, 3000);
        
      } else {
        throw new Error(response.error || 'Background processing failed');
      }
      
    } catch (error) {
      console.error('Error processing API keys in background:', error);
      showErrorMessage('Failed to process API keys. Please try again.');
      
      // Remove progress dialog
      const progressDiv = document.getElementById('apiKeyProgress');
      if (progressDiv) {
        progressDiv.remove();
      }
    } finally {
      // Restore button state
      addButton.textContent = originalText;
      addButton.disabled = false;
      
      // Clear input
      if (provider === 'openai') {
        openaiKeyInput.value = '';
      } else if (provider === 'gemini') {
        geminiKeyInput.value = '';
      }
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
    console.log('renderApiKeys called:', {
      currentProvider,
      openaiKeys: openaiKeys.length,
      geminiKeys: geminiKeys.length
    });
    
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
      return 1; // 1 second for OpenAI
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
          // Set RPD flag (daily recovery - next day)
          key.usage.rpdLimited = true;
          key.usage.rpdLimitedDate = new Date().toDateString();
          
          // Keep legacy flag for backward compatibility
          key.usage.isRateLimited = true;
          key.usage.rateLimitReset = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        }
      }
      
      renderApiKeys();
      updateApiStats();
      saveAiSettings();
    }
  }
  
  async function saveAiSettings() {
    try {
      console.log('🔄 Popup: Saving API keys through background script...', {
        openai: openaiKeys.length,
        gemini: geminiKeys.length,
        openaiKeys: openaiKeys.map(k => ({ id: k.id, masked: k.masked })),
        geminiKeys: geminiKeys.map(k => ({ id: k.id, masked: k.masked }))
      });
      
      // Save API keys through background script (which has access to Chrome storage)
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'saveApiKeys',
          openaiKeys: openaiKeys,
          geminiKeys: geminiKeys
        }, (response) => {
          console.log('🔄 Popup: Received save response from background:', response);
          resolve(response);
        });
      });
      
      if (response && response.success) {
        console.log('✅ Popup: API keys saved through background script:', { 
          openai: openaiKeys.length, 
          gemini: geminiKeys.length 
        });
      } else {
        console.error('❌ Popup: Failed to save API keys through background script:', response);
      }
      
      // Save only essential settings to Chrome storage (no API keys)
      chrome.storage.sync.set({
        aiProvider: currentProvider,
        selectedOpenaiKey: selectedOpenaiKey,
        selectedGeminiKey: selectedGeminiKey
      }, function() {
        if (chrome.runtime.lastError) {
          console.error('⚠️ Failed to save settings to sync storage:', chrome.runtime.lastError);
        } else {
          console.log('📦 Saved AI settings to sync storage (no API keys)');
        }
        
        // Notify all tabs that API keys have been updated
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'updateApiKeys'
              }).catch(() => {});
            }
          });
        });
      });
      
    } catch (error) {
      console.error('Failed to save API keys to IndexedDB:', error);
      showErrorMessage('Failed to save API keys. Please try again.');
    }
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
      left: 20px;
      background: #48BB78;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      animation: slideInLeft 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      successDiv.style.animation = 'slideOutLeft 0.3s ease-in';
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
      left: 20px;
      background: #F56565;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      animation: slideInLeft 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(245, 101, 101, 0.3);
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.style.animation = 'slideOutLeft 0.3s ease-in';
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
    @keyframes slideInLeft {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutLeft {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(- 100%);
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