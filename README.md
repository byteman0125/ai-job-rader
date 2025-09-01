# 🔍 Keyword Highlighter Extension

A beautiful browser extension that highlights predefined keywords on web pages with customizable colors and automatically extracts job information from job sites.

## ✨ Features

### 🎨 **Beautiful UI**
- Modern, gradient-based design
- Smooth animations and hover effects
- Compact, efficient layout
- Responsive drag-and-drop badge

### 🔑 **Keyword Highlighting**
- Customizable keywords with individual colors
- Real-time highlighting across all websites
- Automatic detection of dynamic content
- Beautiful highlight effects with shadows

### 💼 **Job Information Extraction**
- **NEW!** Automatically detects job sites
- Uses GPT-3.5 Turbo to extract position and company names
- Displays job info in the floating badge
- Smart content analysis for accurate extraction

## 🚀 **Setup Instructions**

### 1. **Install the Extension**
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

### 2. **Configure OpenAI API Key**
1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Open `config.js` in the extension folder
3. Replace `'YOUR_OPENAI_API_KEY'` with your actual API key
4. Save the file and reload the extension

### 3. **Add Your Keywords**
1. Click the extension icon in your toolbar
2. Add keywords with custom colors
3. Keywords will be automatically highlighted across all websites

## 🎯 **How Job Extraction Works**

### **Automatic Detection**
The extension automatically detects job sites by scanning:
- URL for job-related keywords
- Page content for job-related terms
- Common job site patterns

### **Smart Extraction**
When a job site is detected:
1. Page content is analyzed (first 2000 characters)
2. GPT-3.5 Turbo extracts position and company names
3. Information is displayed in the floating badge
4. Results are cached for the current session

### **Supported Job Sites**
- LinkedIn Jobs
- Indeed
- Glassdoor
- Company career pages
- Any page with job-related content

## 🎨 **Customization**

### **Colors**
- Each keyword can have its own color
- Beautiful gradient backgrounds
- Consistent theme throughout

### **Badge Position**
- Drag the floating badge anywhere on screen
- Position is automatically saved
- Responsive design for all screen sizes

### **Keywords**
- Add unlimited keywords
- Case-insensitive matching
- Duplicate prevention
- Easy deletion with confirmation

## 🔧 **Technical Details**

### **Architecture**
- Manifest V3 compliant
- Content script for page interaction
- Popup for user interface
- Chrome storage for persistence

### **Performance**
- Efficient DOM traversal
- Debounced highlighting
- Memory leak prevention
- Optimized for large pages

### **API Integration**
- OpenAI GPT-3.5 Turbo
- Configurable API settings
- Error handling and logging
- Rate limiting considerations

## 📱 **Browser Support**

- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Brave
- ✅ Other Chromium-based browsers

## 🛠 **Development**

### **File Structure**
```
├── manifest.json          # Extension configuration
├── config.js             # API keys and settings
├── content.js            # Main functionality
├── popup.html            # User interface
├── popup.js              # Popup logic
├── icon16.svg            # 16x16 icon
├── icon48.svg            # 48x48 icon
├── icon128.svg           # 128x128 icon
└── demo.html             # Test page
```

### **Key Functions**
- `detectJobSite()` - Identifies job-related pages
- `extractJobInfo()` - Uses GPT-3.5 Turbo for extraction
- `highlightKeywords()` - Highlights keywords on page
- `updateBadge()` - Updates floating badge display

## 🎉 **Usage Examples**

### **Job Search**
1. Visit any job site (LinkedIn, Indeed, etc.)
2. Extension automatically detects it's a job site
3. Job position and company are extracted
4. Information appears in the floating badge
5. Keywords are highlighted throughout the page

### **Content Analysis**
1. Browse any webpage
2. Add relevant keywords
3. See them highlighted automatically
4. Track match counts in real-time

## 🔒 **Privacy & Security**

- **No data collection** - All processing is local
- **API calls only** - No data sent to third parties
- **Secure storage** - Uses Chrome's secure storage
- **Open source** - Transparent code for review

## 🆘 **Troubleshooting**

### **Job Info Not Appearing**
- Check your OpenAI API key in `config.js`
- Ensure you have sufficient API credits
- Check browser console for error messages
- Verify the page contains job-related content

### **Keywords Not Highlighting**
- Reload the extension
- Check if keywords are added in popup
- Ensure page is fully loaded
- Check for JavaScript errors

### **Badge Not Dragging**
- Click and drag the handle (⋮⋮) at the top
- Check if any other extensions interfere
- Reload the page if needed

## 📄 **License**

This project is open source and available under the MIT License.

## 🤝 **Contributing**

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Made with ❤️ for better web browsing and job searching!**
