// Background service worker for AgileEmails
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    categories: {
      'school': { enabled: true, color: '#4A90E2', autoDelete: null },
      'work-current': { enabled: true, color: '#E24A4A', autoDelete: null },
      'work-opportunities': { enabled: true, color: '#E2A44A', autoDelete: null },
      'finance': { enabled: true, color: '#4AE24A', autoDelete: null },
      'personal': { enabled: true, color: '#E24AE2', autoDelete: null },
      'auth-codes': { enabled: true, color: '#A4A4A4', autoDelete: 1 },
      'promo': { enabled: true, color: '#FFB84D', autoDelete: 1 },
      'other': { enabled: true, color: '#808080', autoDelete: null }
    },
    dndRules: [],
    pricingTier: 'free',
    settings: {
      contextWindow: 7, // days
      autoDeleteOldEmails: true,
      autoDeleteThresholds: {
        '3months': false,
        '6months': false,
        '1year': true
      },
      reorderByPriority: false // Disabled by default to prevent overlay issues
    }
  });
});

// Listen for alarms (for auto-delete and periodic checks)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'processEmails') {
    processEmails();
  } else if (alarm.name.startsWith('autoDelete-')) {
    handleAutoDelete(alarm.name);
  }
});

// Create periodic alarm for email processing
chrome.alarms.create('processEmails', { periodInMinutes: 15 });

// Process emails in the background
async function processEmails() {
  try {
    const tabs = await new Promise((resolve) => {
      chrome.tabs.query({ url: 'https://mail.google.com/*' }, resolve);
    });
    
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'processEmails' }, (response) => {
        if (chrome.runtime.lastError) {
          // Tab might not have content script loaded yet, ignore
          console.debug('AgileEmails: Could not send message to tab', tab.id, chrome.runtime.lastError.message);
        }
      });
    });
  } catch (error) {
    console.error('AgileEmails: Error processing emails', error);
  }
}

function handleAutoDelete(alarmName) {
  try {
    const category = alarmName.replace('autoDelete-', '');
    chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('AgileEmails: Error querying tabs', chrome.runtime.lastError);
        return;
      }
      
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'autoDelete', category }, (response) => {
          if (chrome.runtime.lastError) {
            console.debug('AgileEmails: Could not send auto-delete message to tab', tab.id);
          }
        });
      });
    });
  } catch (error) {
    console.error('AgileEmails: Error handling auto-delete', error);
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.local.get(['categories', 'dndRules', 'settings', 'pricingTier'], (data) => {
      sendResponse(data);
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'saveEmailData') {
    // Use async pattern to prevent race conditions
    chrome.storage.local.get(['emailData'], (data) => {
      try {
        const emailData = data.emailData || [];
        
        // Check if email already exists (prevent duplicates)
        const existingIndex = emailData.findIndex(e => e.id === request.emailData.id);
        if (existingIndex >= 0) {
          // Update existing email
          emailData[existingIndex] = request.emailData;
        } else {
          // Add new email
          emailData.push(request.emailData);
        }
        
        // Keep last 1000 emails, sorted by processedAt (newest first)
        const sorted = emailData.sort((a, b) => (b.processedAt || 0) - (a.processedAt || 0));
        const trimmed = sorted.slice(0, 1000);
        
        chrome.storage.local.set({ emailData: trimmed }, () => {
          if (chrome.runtime.lastError) {
            console.error('AgileEmails: Error saving email data', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true });
          }
        });
      } catch (error) {
        console.error('AgileEmails: Error processing email data', error);
        sendResponse({ success: false, error: error.message });
      }
    });
    return true; // Keep channel open for async response
  }
  return false;
});


