// =====================================================
// AgileEmails - Popup Script v2.0
// Modern email intelligence popup
// =====================================================

let classifier;

try {
  classifier = new EmailClassifier();
} catch (e) {
  console.error('AgileEmails: Failed to initialize classifier', e);
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    loadSettings();
    setupTabs();
    loadFocusEmails();
    setupBoostSection();
    setupFooter();
    setupRefresh();
    updateStats();
  } catch (error) {
    console.error('AgileEmails: Error initializing popup', error);
  }
});

// ---- TAB MANAGEMENT ----
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabEl = document.getElementById(`${targetTab}-tab`);
      if (tabEl) tabEl.classList.add('active');

      if (targetTab === 'focus') loadFocusEmails();
      else if (targetTab === 'today') loadTodayEmails();
      else if (targetTab === 'digest') loadDigestView();
      else if (targetTab === 'muted') loadMutedEmails();
    });
  });
}

// ---- SETTINGS ----
function loadSettings() {
  chrome.storage.local.get(['pricingTier'], (data) => {
    const tier = data.pricingTier || 'free';
    const badge = document.getElementById('pricingBadge');
    if (badge) {
      badge.textContent = tier.toUpperCase();
      badge.className = `pricing-badge ${tier}`;
    }
  });
}

// ---- STATS BAR ----
function updateStats() {
  chrome.storage.local.get(['emailData'], (data) => {
    const emails = data.emailData || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let urgent = 0, todayCount = 0, actionCount = 0;

    for (const email of emails) {
      if (email.starRating >= 4 || email.priority >= 4) urgent++;
      if (email.genre === 'action-required') actionCount++;

      if (email.date) {
        try {
          const d = new Date(email.date);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() === today.getTime()) todayCount++;
        } catch (e) { /* skip */ }
      }
    }

    setText('statUrgent', urgent);
    setText('statToday', todayCount);
    setText('statAction', actionCount);
    setText('statTotal', emails.length);
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ---- FOCUS TAB (High Priority) ----
function loadFocusEmails() {
  const list = document.getElementById('focusList');
  if (!list) return;
  list.innerHTML = loadingHTML('Loading focus emails...');

  chrome.storage.local.get(['emailData', 'categories'], (data) => {
    try {
      const emails = (data.emailData || []).filter(email => {
        if (email.category === 'other' || email.isNonHuman) return false;
        if (email.category === 'promo' || email.category === 'auth-codes') return false;
        const stars = email.starRating || email.priority || 1;
        return stars >= 4;
      });

      emails.sort((a, b) => {
        const sa = a.starRating || a.priority || 1;
        const sb = b.starRating || b.priority || 1;
        if (sb !== sa) return sb - sa;
        return (b.processedAt || 0) - (a.processedAt || 0);
      });

      if (emails.length === 0) {
        list.innerHTML = emptyStateHTML('All clear', 'No high-priority emails need your attention.');
        return;
      }

      list.innerHTML = emails.map(e => createEmailCard(e, data.categories)).join('');
      attachCardClicks(list);
    } catch (error) {
      console.error('AgileEmails: Error loading focus emails', error);
      list.innerHTML = emptyStateHTML('Error', 'Could not load emails.');
    }
  });
}

// ---- TODAY TAB ----
function loadTodayEmails() {
  const list = document.getElementById('todayList');
  if (!list) return;
  list.innerHTML = loadingHTML("Loading today's emails...");

  chrome.storage.local.get(['emailData', 'categories'], (data) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const emails = (data.emailData || []).filter(email => {
        if (!email.date) return false;
        try {
          const d = new Date(email.date);
          if (isNaN(d.getTime())) return false;
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        } catch (e) { return false; }
      });

      emails.sort((a, b) => {
        const sa = a.starRating || a.priority || 1;
        const sb = b.starRating || b.priority || 1;
        if (sb !== sa) return sb - sa;
        return (b.processedAt || 0) - (a.processedAt || 0);
      });

      if (emails.length === 0) {
        list.innerHTML = emptyStateHTML('No emails today', 'Your inbox is quiet.');
        return;
      }

      list.innerHTML = emails.map(e => createEmailCard(e, data.categories)).join('');
      attachCardClicks(list);
    } catch (error) {
      console.error('AgileEmails: Error loading today emails', error);
      list.innerHTML = emptyStateHTML('Error', 'Could not load emails.');
    }
  });
}

// ---- DIGEST TAB (Grouped by sender) ----
function loadDigestView() {
  const container = document.getElementById('digestView');
  if (!container) return;
  container.innerHTML = loadingHTML('Loading digest...');

  chrome.storage.local.get(['emailData', 'categories'], (data) => {
    try {
      const emails = (data.emailData || []).filter(e =>
        e.category !== 'auth-codes' && !e.isNonHuman
      );

      // Group by sender
      const groups = {};
      for (const email of emails) {
        const sender = (email.from || 'Unknown').toLowerCase();
        if (!groups[sender]) {
          groups[sender] = { sender: email.from || 'Unknown', emails: [], maxStars: 0 };
        }
        groups[sender].emails.push(email);
        const stars = email.starRating || email.priority || 1;
        groups[sender].maxStars = Math.max(groups[sender].maxStars, stars);
      }

      // Sort groups by max star rating, then by email count
      const sortedGroups = Object.values(groups).sort((a, b) => {
        if (b.maxStars !== a.maxStars) return b.maxStars - a.maxStars;
        return b.emails.length - a.emails.length;
      });

      if (sortedGroups.length === 0) {
        container.innerHTML = emptyStateHTML('No emails', 'Nothing to digest yet.');
        return;
      }

      container.innerHTML = sortedGroups.slice(0, 20).map(group => {
        const avatarColor = stringToColor(group.sender);
        const initial = (group.sender[0] || '?').toUpperCase();
        const maxStarsHtml = renderStarsColored(group.maxStars);

        // Sort emails within group by star rating
        group.emails.sort((a, b) => (b.starRating || b.priority || 1) - (a.starRating || a.priority || 1));

        const emailItems = group.emails.slice(0, 5).map(email => {
          const stars = email.starRating || email.priority || 1;
          const catColor = getCategoryColor(email.category, data.categories);
          const catLabel = getCategoryLabel(email.category);
          return `
            <div class="digest-email-item" data-email-id="${esc(email.id || '')}">
              <span class="digest-email-stars">${renderStarsColored(stars)}</span>
              <span class="digest-email-subject">${esc(email.subject || 'No subject')}</span>
              <span class="digest-email-badge" style="background:${catColor}">${esc(catLabel)}</span>
            </div>
          `;
        }).join('');

        return `
          <div class="digest-group">
            <div class="digest-group-header">
              <div class="digest-avatar" style="background:${avatarColor}">${initial}</div>
              <div class="digest-sender-info">
                <div class="digest-sender-name">${esc(group.sender)}</div>
                <div class="digest-count">${group.emails.length} email${group.emails.length !== 1 ? 's' : ''}</div>
              </div>
              <span class="digest-max-stars">${maxStarsHtml}</span>
            </div>
            <div class="digest-emails">${emailItems}</div>
          </div>
        `;
      }).join('');

      attachCardClicks(container);
    } catch (error) {
      console.error('AgileEmails: Error loading digest', error);
      container.innerHTML = emptyStateHTML('Error', 'Could not load digest.');
    }
  });
}

// ---- MUTED TAB (Low priority, promos, newsletters) ----
function loadMutedEmails() {
  const list = document.getElementById('mutedList');
  if (!list) return;
  list.innerHTML = loadingHTML('Loading muted emails...');

  chrome.storage.local.get(['emailData', 'categories'], (data) => {
    try {
      const emails = (data.emailData || []).filter(email => {
        const stars = email.starRating || email.priority || 1;
        return stars <= 2 ||
          email.category === 'promo' ||
          email.category === 'auth-codes' ||
          email.category === 'other' ||
          email.isNonHuman ||
          email.isNewsletter;
      });

      emails.sort((a, b) => {
        const sa = a.starRating || a.priority || 1;
        const sb = b.starRating || b.priority || 1;
        if (sb !== sa) return sb - sa;
        return (b.processedAt || 0) - (a.processedAt || 0);
      });

      if (emails.length === 0) {
        list.innerHTML = emptyStateHTML('No muted emails', 'All clear.');
        return;
      }

      list.innerHTML = emails.map(e => createEmailCard(e, data.categories)).join('');
      attachCardClicks(list);
    } catch (error) {
      console.error('AgileEmails: Error loading muted emails', error);
      list.innerHTML = emptyStateHTML('Error', 'Could not load emails.');
    }
  });
}

// ---- EMAIL CARD BUILDER ----
function createEmailCard(email, categories) {
  const stars = email.starRating || email.priority || 1;
  const starsHtml = renderStarsColored(stars);
  const catColor = getCategoryColor(email.category, categories);
  const catLabel = getCategoryLabel(email.category);
  const subCatLabel = email.subCategory ? email.subCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
  const genreIcon = email.genreIcon || '';
  const genreLabel = email.genreLabel || '';

  // Build detail chips
  let detailsHtml = '';
  const chips = [];

  // Urgency signals
  if (email.urgency && email.urgency.signals && email.urgency.signals.length > 0) {
    const topSignal = email.urgency.signals[0];
    chips.push(`<span class="detail-chip urgent">${esc(topSignal)}</span>`);
  }

  // Genre chip for action-required
  if (email.genre === 'action-required') {
    chips.push(`<span class="detail-chip action">Action Required</span>`);
  }

  // Money
  if (email.importantInfo?.money?.length > 0) {
    chips.push(`<span class="detail-chip money">${esc(email.importantInfo.money[0])}</span>`);
  }

  // Dates
  if (email.importantInfo?.dates?.length > 0) {
    chips.push(`<span class="detail-chip date">${esc(email.importantInfo.dates[0])}</span>`);
  }

  // Sentiment
  if (email.sentiment && email.sentiment.confidence > 0.3 && email.sentiment.label !== 'neutral') {
    const sentClass = email.sentiment.label === 'positive' ? 'money' : 'urgent';
    const sentSymbol = email.sentiment.label === 'positive' ? '+' : '−';
    chips.push(`<span class="detail-chip ${sentClass}">${sentSymbol} ${email.sentiment.label}</span>`);
  }

  if (chips.length > 0) {
    detailsHtml = `<div class="card-details">${chips.slice(0, 4).join('')}</div>`;
  }

  // Footer with genre and summary
  let footerHtml = '';
  const footerParts = [];

  if (genreIcon && genreLabel) {
    footerParts.push(`<span class="card-genre">${genreIcon} ${esc(genreLabel)}</span>`);
  }

  if (email.summary) {
    footerParts.push(`<span class="card-summary" title="${esc(email.summary)}">${esc(email.summary)}</span>`);
  }

  if (email.isNewsletter) {
    footerParts.push(`<span class="badge-newsletter">Newsletter</span>`);
  }
  if (email.isDND) {
    footerParts.push(`<span class="badge-dnd">DND</span>`);
  }

  if (footerParts.length > 0) {
    footerHtml = `<div class="card-footer">${footerParts.join('')}</div>`;
  }

  return `
    <div class="email-card" data-email-id="${esc(email.id || '')}" data-stars="${stars}">
      <div class="card-top">
        <span class="card-stars">${starsHtml}</span>
        <span class="card-subject">${esc(email.subject || 'No subject')}</span>
      </div>
      <div class="card-meta">
        <span class="card-sender">${esc(email.from || 'Unknown')}</span>
        <span class="card-dot"></span>
        <span class="card-category-badge" style="background:${catColor}">${esc(catLabel)}</span>
        ${subCatLabel ? `<span class="card-subcategory">${esc(subCatLabel)}</span>` : ''}
      </div>
      ${detailsHtml}
      ${footerHtml}
    </div>
  `;
}

// ---- HELPERS ----
function renderStarsColored(starRating) {
  const colors = {
    5: '#DC2626', 4: '#EA580C', 3: '#D97706', 2: '#65A30D', 1: '#9CA3AF'
  };
  const color = colors[starRating] || colors[1];
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += i <= starRating ? '\u2605' : '\u2606';
  }
  return `<span style="color:${color}">${html}</span>`;
}

function getCategoryColor(category, categories) {
  if (classifier) return classifier.getCategoryColor(category);
  return categories?.[category]?.color || '#808080';
}

function getCategoryLabel(category) {
  if (classifier) return classifier.getCategoryLabel(category);
  return (category || 'other').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 55%)`;
}

function esc(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function loadingHTML(text) {
  return `<div class="loading"><div class="loading-spinner"></div><span>${esc(text)}</span></div>`;
}

function emptyStateHTML(title, subtitle) {
  return `
    <div class="empty-state">
      <div class="empty-state-text">${esc(title)}</div>
      <div class="empty-state-sub">${esc(subtitle)}</div>
    </div>
  `;
}

// ---- CARD CLICK HANDLER ----
function attachCardClicks(container) {
  if (!container) return;
  const clickables = container.querySelectorAll('.email-card, .digest-email-item');
  clickables.forEach(card => {
    card.addEventListener('click', () => {
      const emailId = card.dataset.emailId;
      if (!emailId) return;
      chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.update(tabs[0].id, { active: true });
          chrome.tabs.sendMessage(tabs[0].id, { action: 'highlightEmail', emailId }, () => {});
        } else {
          chrome.tabs.create({ url: 'https://mail.google.com/', active: true }, (tab) => {
            setTimeout(() => chrome.tabs.sendMessage(tab.id, { action: 'highlightEmail', emailId }, () => {}), 3000);
          });
        }
      });
    });
  });
}

// ---- BOOST SECTION ----
function setupBoostSection() {
  const toggle = document.getElementById('boostToggle');
  const content = document.getElementById('boostContent');
  const section = document.getElementById('boostSection');
  const addBtn = document.getElementById('boostAddBtn');

  if (toggle && content && section) {
    toggle.addEventListener('click', () => {
      const isOpen = content.style.display !== 'none';
      content.style.display = isOpen ? 'none' : 'block';
      section.classList.toggle('open', !isOpen);
    });
  }

  if (addBtn) addBtn.addEventListener('click', addBoostSenders);
  loadBoostSenders();
}

function loadBoostSenders() {
  const listEl = document.getElementById('boostList');
  if (!listEl) return;
  chrome.storage.local.get(['priorityBoostSenders'], (data) => {
    const list = data.priorityBoostSenders || [];
    if (list.length === 0) {
      listEl.innerHTML = '<span class="boost-empty">No boost senders yet.</span>';
      return;
    }
    listEl.innerHTML = list.map((addr, i) =>
      `<span class="boost-chip">${esc(addr)}<button type="button" class="boost-chip-remove" data-index="${i}">x</button></span>`
    ).join('');
    listEl.querySelectorAll('.boost-chip-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-index'), 10);
        const next = list.filter((_, j) => j !== index);
        chrome.storage.local.set({ priorityBoostSenders: next }, () => loadBoostSenders());
      });
    });
  });
}

function addBoostSenders() {
  const input = document.getElementById('boostEmailsInput');
  if (!input) return;
  const raw = (input.value || '').trim();
  if (!raw) return;
  const newAddrs = raw.split(/[\n,]+/).map(s => s.trim().toLowerCase()).filter(s => s && s.includes('@'));
  if (newAddrs.length === 0) { input.value = ''; return; }
  chrome.storage.local.get(['priorityBoostSenders'], (data) => {
    const list = data.priorityBoostSenders || [];
    const combined = [...list];
    newAddrs.forEach(addr => { if (!combined.includes(addr)) combined.push(addr); });
    chrome.storage.local.set({ priorityBoostSenders: combined }, () => {
      input.value = '';
      loadBoostSenders();
    });
  });
}

// ---- FOOTER ----
function setupFooter() {
  const settingsBtn = document.getElementById('settingsBtn');
  const upgradeBtn = document.getElementById('upgradeBtn');
  if (settingsBtn) settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  if (upgradeBtn) upgradeBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
}

// ---- REFRESH ----
function setupRefresh() {
  const btn = document.getElementById('refreshAll');
  if (btn) {
    btn.addEventListener('click', () => {
      // Trigger reprocessing via content script
      chrome.tabs.query({ url: 'https://mail.google.com/*' }, (tabs) => {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, { action: 'processEmails' }, () => {});
        }
      });
      // Reload current view
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab) activeTab.click();
      updateStats();
    });
  }
}
