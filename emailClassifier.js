// =====================================================
// AgileEmails - Advanced Email Intelligence Engine v2.0
// =====================================================
// Award-winning NLP-powered email classification
// Features: Stemming, N-grams, TF-IDF scoring,
// entity extraction, urgency analysis, genre detection,
// sub-categories, 5-star ratings, email summarization
// =====================================================

// =====================================================
// PART 1: NLP ENGINE
// =====================================================

class NLPEngine {
  constructor() {
    this.stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'shall', 'can', 'it', 'its',
      'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
      'you', 'your', 'he', 'she', 'they', 'them', 'his', 'her', 'their',
      'what', 'which', 'who', 'whom', 'how', 'when', 'where', 'why',
      'not', 'no', 'nor', 'if', 'then', 'else', 'so', 'up', 'out',
      'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'under', 'again', 'further', 'once', 'here',
      'there', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
      'other', 'some', 'such', 'only', 'own', 'same', 'than', 'too',
      'very', 'just', 'because', 'as', 'until', 'while', 'also', 'am'
    ]);

    // Precompile regex patterns for performance
    this._datePatterns = [
      /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g,
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:\s*,?\s*\d{2,4})?\b/gi,
      /\b\d{1,2}(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?(?:\s*,?\s*\d{2,4})?\b/gi,
      /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
      /\b(tomorrow|today|tonight|next\s+(?:week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/gi,
      /\b(end\s+of\s+(?:day|week|month|quarter|year))\b/gi,
      /\b(eod|eow|eom)\b/gi,
      /\b(\d{1,2}:\d{2}\s*(?:am|pm)?)\b/gi,
      /\b(within\s+\d+\s+(?:hour|day|week|month)s?)\b/gi
    ];

    this._moneyPattern = /(?:\$|USD|EUR|GBP|£|€)\s*[\d,]+(?:\.\d{1,2})?|\b[\d,]+(?:\.\d{1,2})?\s*(?:dollars?|USD|EUR|GBP)\b/gi;
    this._urlPattern = /https?:\/\/[^\s<>"']+/gi;
    this._phonePattern = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    this._emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  }

  // Tokenize text: split, lowercase, remove stop words
  tokenize(text) {
    if (!text) return [];
    return text.toLowerCase()
      .replace(/[^\w\s@.-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1 && !this.stopWords.has(t));
  }

  // Simplified Porter stemmer for English
  stem(word) {
    if (!word || word.length < 4) return word;
    let w = word.toLowerCase();

    // Step 1: plurals and past participles
    if (w.endsWith('sses')) w = w.slice(0, -2);
    else if (w.endsWith('ies') && w.length > 4) w = w.slice(0, -2);
    else if (w.endsWith('ss')) { /* keep */ }
    else if (w.endsWith('s') && w.length > 3) w = w.slice(0, -1);

    // Step 2: -ed, -ing
    if (w.endsWith('eed')) w = w.slice(0, -1);
    else if (w.endsWith('ed') && w.length > 4) {
      w = w.slice(0, -2);
      if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) w += 'e';
    } else if (w.endsWith('ing') && w.length > 5) {
      w = w.slice(0, -3);
      if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) w += 'e';
    }

    // Step 3: common suffixes
    const suffixes = [
      ['ational', 'ate'], ['tional', 'tion'], ['enci', 'ence'],
      ['anci', 'ance'], ['izer', 'ize'], ['ation', 'ate'],
      ['ator', 'ate'], ['alism', 'al'], ['iveness', 'ive'],
      ['fulness', 'ful'], ['ousness', 'ous'], ['aliti', 'al'],
      ['iviti', 'ive'], ['biliti', 'ble'], ['ment', 'ment'],
      ['ness', ''], ['ity', ''], ['ment', ''],
      ['ence', ''], ['ance', ''], ['able', ''],
      ['ible', ''], ['ive', ''], ['ous', ''], ['ful', '']
    ];

    for (const [suffix, replacement] of suffixes) {
      if (w.endsWith(suffix) && w.length - suffix.length >= 3) {
        w = w.slice(0, -suffix.length) + replacement;
        break;
      }
    }

    return w;
  }

  // Generate n-grams from tokens
  ngrams(tokens, n) {
    const result = [];
    for (let i = 0; i <= tokens.length - n; i++) {
      result.push(tokens.slice(i, i + n).join(' '));
    }
    return result;
  }

  // TF-IDF-like scoring: how relevant are keywords to a category
  tfidfScore(tokens, categoryKeywords, allCategoryKeywords) {
    if (!tokens.length || !categoryKeywords.length) return 0;

    const tokenFreq = {};
    const stemmedTokens = tokens.map(t => this.stem(t));
    stemmedTokens.forEach(t => { tokenFreq[t] = (tokenFreq[t] || 0) + 1; });

    let score = 0;
    const stemmedKeywords = categoryKeywords.map(k => {
      const parts = k.toLowerCase().split(/\s+/);
      return parts.map(p => this.stem(p)).join(' ');
    });

    // Count how many categories contain each keyword (for IDF)
    const keywordCategoryCount = {};
    const totalCategories = Object.keys(allCategoryKeywords).length || 1;

    for (const [, keywords] of Object.entries(allCategoryKeywords)) {
      const stemmed = new Set(keywords.map(k => this.stem(k.toLowerCase().split(/\s+/)[0])));
      stemmed.forEach(s => {
        keywordCategoryCount[s] = (keywordCategoryCount[s] || 0) + 1;
      });
    }

    for (let i = 0; i < stemmedKeywords.length; i++) {
      const kw = stemmedKeywords[i];
      const kwParts = kw.split(' ');
      const originalIndex = i;

      // Position weight: keywords earlier in the list are more important
      const positionWeight = 1.0 - (originalIndex / (categoryKeywords.length || 1)) * 0.6;

      if (kwParts.length === 1) {
        // Single word: check token frequency
        const tf = tokenFreq[kwParts[0]] || 0;
        if (tf > 0) {
          const idf = Math.log(totalCategories / (keywordCategoryCount[kwParts[0]] || 1));
          score += tf * Math.max(idf, 0.5) * positionWeight;
        }
      } else {
        // Multi-word: check in original text (stemmed bigrams/trigrams)
        const stemmedText = stemmedTokens.join(' ');
        if (stemmedText.includes(kw)) {
          score += 3.0 * positionWeight; // bonus for exact phrase match
        }
      }
    }

    // Normalize by token count to avoid bias toward longer texts
    return tokens.length > 0 ? score / Math.sqrt(tokens.length) : 0;
  }

  // Extract entities from text
  extractEntities(text) {
    if (!text) return { dates: [], money: [], urls: [], phones: [], emails: [], actionItems: [] };

    const entities = {
      dates: [],
      money: [],
      urls: [],
      phones: [],
      emails: [],
      actionItems: []
    };

    // Dates
    for (const pattern of this._datePatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const dateStr = match[0].trim();
        if (!entities.dates.includes(dateStr)) {
          entities.dates.push(dateStr);
        }
      }
    }

    // Money
    this._moneyPattern.lastIndex = 0;
    let match;
    while ((match = this._moneyPattern.exec(text)) !== null) {
      entities.money.push(match[0].trim());
    }

    // URLs
    this._urlPattern.lastIndex = 0;
    while ((match = this._urlPattern.exec(text)) !== null) {
      entities.urls.push(match[0]);
    }

    // Phones
    this._phonePattern.lastIndex = 0;
    while ((match = this._phonePattern.exec(text)) !== null) {
      entities.phones.push(match[0]);
    }

    // Emails
    this._emailPattern.lastIndex = 0;
    while ((match = this._emailPattern.exec(text)) !== null) {
      entities.emails.push(match[0]);
    }

    // Action items: lines starting with imperative verbs or bullet points
    const lines = text.split(/[\n\r]+/);
    const actionVerbs = /^(?:[-*•]\s*)?(?:please\s+)?(?:submit|review|approve|sign|complete|send|update|confirm|schedule|prepare|attend|respond|reply|forward|check|verify|upload|download|fill|register|book|cancel|renew|pay|call|email|contact|notify|assign|delegate|prioritize|finalize|deploy|test|fix|resolve|implement|create|delete|remove|add|change|modify)/i;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 5 && trimmed.length < 200 && actionVerbs.test(trimmed)) {
        entities.actionItems.push(trimmed);
      }
    }

    return entities;
  }

  // Analyze urgency level of text (0-10 scale)
  analyzeUrgency(text) {
    if (!text) return { score: 0, signals: [] };

    const lower = text.toLowerCase();
    let score = 0;
    const signals = [];

    // Critical urgency (3 points each)
    const criticalPatterns = [
      [/\b(?:emergency|critical|crisis|outage|down|broken)\b/i, 'Emergency language'],
      [/\b(?:expires?\s*today|due\s*today|last\s*day|final\s*day)\b/i, 'Due today'],
      [/\b(?:immediate(?:ly)?|right\s*now|asap|a\.s\.a\.p)\b/i, 'Immediate action'],
      [/\b(?:security\s*(?:alert|breach|incident))\b/i, 'Security alert'],
      [/\b(?:account\s*(?:locked|suspended|compromised|disabled))\b/i, 'Account issue']
    ];

    // High urgency (2 points each)
    const highPatterns = [
      [/\b(?:urgent|urgently|time[- ]sensitive)\b/i, 'Marked urgent'],
      [/\b(?:deadline|due\s*date)\b/i, 'Has deadline'],
      [/\b(?:action\s*required|action\s*needed|response\s*(?:required|needed))\b/i, 'Action required'],
      [/\b(?:final\s*(?:notice|reminder|warning))\b/i, 'Final notice'],
      [/\b(?:overdue|past\s*due|late\s*(?:payment|fee))\b/i, 'Overdue'],
      [/\b(?:approval\s*(?:needed|required)|pending\s*(?:your|approval))\b/i, 'Approval needed'],
      [/\b(?:waiting\s*(?:on|for)\s*(?:you|your))\b/i, 'Waiting on you'],
      [/\b(?:must|mandatory|required)\b/i, 'Mandatory action'],
      [/\b(?:2nd\s*reminder|second\s*reminder|follow[- ]?up)\b/i, 'Follow-up reminder'],
      [/\b(?:don'?t\s*forget|reminder|remind)\b/i, 'Reminder']
    ];

    // Medium urgency (1 point each)
    const mediumPatterns = [
      [/\b(?:important|priority|attention)\b/i, 'Marked important'],
      [/\b(?:please\s*(?:respond|reply|confirm|review|approve|submit))\b/i, 'Request to respond'],
      [/\b(?:by\s*(?:end\s*of|eod|eow|close\s*of|tomorrow|friday|monday))\b/i, 'Near deadline'],
      [/\b(?:meeting|call|interview)\s*(?:at|on|tomorrow|today)\b/i, 'Upcoming event'],
      [/\b(?:need|needs)\s*(?:your|to|a)\b/i, 'Needs action'],
      [/\b(?:fyi|heads?\s*up|be\s*aware)\b/i, 'Heads up'],
      [/\b(?:confirm|confirmation|rsvp)\b/i, 'Confirmation needed']
    ];

    for (const [pattern, signal] of criticalPatterns) {
      if (pattern.test(lower)) {
        score += 3;
        signals.push(signal);
      }
    }

    for (const [pattern, signal] of highPatterns) {
      if (pattern.test(lower)) {
        score += 2;
        signals.push(signal);
      }
    }

    for (const [pattern, signal] of mediumPatterns) {
      if (pattern.test(lower)) {
        score += 1;
        signals.push(signal);
      }
    }

    // Caps lock emphasis bonus
    const capsWords = (text.match(/\b[A-Z]{3,}\b/g) || []).filter(w =>
      !['THE', 'AND', 'FOR', 'YOU', 'ARE', 'NOT', 'BUT', 'HAS', 'HAD',
        'FYI', 'CEO', 'CTO', 'CFO', 'COO', 'VP', 'PR', 'HR', 'IT',
        'URL', 'PDF', 'CSV', 'API', 'FAQ', 'USD', 'EUR', 'GBP'].includes(w)
    );
    if (capsWords.length >= 2) {
      score += 1;
      signals.push('Emphasis (caps)');
    }

    // Exclamation marks
    const exclamations = (text.match(/!/g) || []).length;
    if (exclamations >= 2) {
      score += 1;
      signals.push('Emphasis (!)');
    }

    return { score: Math.min(score, 10), signals };
  }

  // Generate brief summary of email (the key 12%)
  summarize(subject, body, maxSentences = 2) {
    const text = (subject || '') + '. ' + (body || '');
    if (!text.trim() || text.trim() === '.') return '';

    // Split into sentences
    const sentences = text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 300);

    if (sentences.length === 0) return subject || '';

    // Score each sentence
    const urgencyTerms = /\b(?:urgent|deadline|due|action|required|important|critical|approve|confirm|submit|meeting|payment|expires?)\b/i;
    const entityTerms = /(?:\$[\d,]+|\d{1,2}[\/\-]\d{1,2}|\b(?:tomorrow|today|monday|tuesday|wednesday|thursday|friday)\b)/i;

    const scored = sentences.map((sentence, index) => {
      let score = 0;
      // First sentence bonus (usually contains key info)
      if (index === 0) score += 3;
      // Second sentence bonus
      if (index === 1) score += 1;
      // Urgency terms
      if (urgencyTerms.test(sentence)) score += 2;
      // Entity mentions
      if (entityTerms.test(sentence)) score += 2;
      // Action items
      if (/^(?:please|kindly|you\s+(?:need|must|should))/i.test(sentence)) score += 2;
      // Penalize very short or very long
      if (sentence.length < 20) score -= 1;
      if (sentence.length > 200) score -= 1;
      // Penalize boilerplate
      if (/\b(?:unsubscribe|privacy\s*policy|view\s*in\s*browser|click\s*here)\b/i.test(sentence)) score -= 5;

      return { sentence, score, index };
    });

    // Sort by score, take top N, then re-sort by original position
    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index)
      .map(s => s.sentence);

    return top.join(' ');
  }

  // Sentiment analysis using lexicon-based approach
  analyzeSentiment(text) {
    if (!text || typeof text !== 'string') return { score: 0, label: 'neutral', confidence: 0 };

    const positive = new Set([
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'love', 'happy', 'pleased', 'thank', 'thanks', 'grateful', 'appreciate',
      'congratulations', 'congrats', 'welcome', 'excited', 'perfect', 'best',
      'enjoy', 'success', 'successful', 'win', 'won', 'approved', 'accepted',
      'confirmed', 'granted', 'awarded', 'beautiful', 'brilliant', 'outstanding',
      'impressive', 'delighted', 'glad', 'fortunate', 'thrilled', 'remarkable',
      'superb', 'terrific', 'incredible', 'helpful', 'friendly', 'generous',
      'kind', 'nice', 'pleasant', 'positive', 'progress', 'improved', 'upgrade',
      'promoted', 'bonus', 'reward', 'discount', 'savings', 'free', 'gift',
      'offer', 'opportunity', 'benefit', 'advantage', 'growth', 'achievement'
    ]);

    const negative = new Set([
      'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate',
      'angry', 'upset', 'disappointed', 'sorry', 'unfortunately', 'regret',
      'fail', 'failed', 'failure', 'reject', 'rejected', 'denied', 'cancel',
      'cancelled', 'problem', 'issue', 'error', 'bug', 'broken', 'damage',
      'loss', 'lost', 'miss', 'missed', 'late', 'overdue', 'expired',
      'complaint', 'concern', 'warning', 'alert', 'danger', 'risk', 'threat',
      'fraud', 'scam', 'spam', 'suspicious', 'unauthorized', 'violation',
      'penalty', 'fine', 'charge', 'debt', 'owe', 'urgent', 'emergency',
      'critical', 'severe', 'serious', 'trouble', 'difficult', 'impossible',
      'unfortunate', 'decline', 'decrease', 'downgrade', 'terminate', 'suspend'
    ]);

    const intensifiers = new Set(['very', 'extremely', 'incredibly', 'absolutely', 'completely', 'totally', 'really', 'highly']);
    const negators = new Set(['not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', 'nor', "n't", 'dont', "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't", "shouldn't"]);

    const words = text.toLowerCase().replace(/[^a-z\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 1);
    let positiveScore = 0;
    let negativeScore = 0;
    let totalSentimentWords = 0;
    let negateNext = false;
    let intensify = false;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      if (negators.has(word) || word.endsWith("n't")) {
        negateNext = true;
        continue;
      }
      if (intensifiers.has(word)) {
        intensify = true;
        continue;
      }

      const multiplier = intensify ? 1.5 : 1;

      if (positive.has(word)) {
        if (negateNext) {
          negativeScore += multiplier;
        } else {
          positiveScore += multiplier;
        }
        totalSentimentWords++;
      } else if (negative.has(word)) {
        if (negateNext) {
          positiveScore += multiplier;
        } else {
          negativeScore += multiplier;
        }
        totalSentimentWords++;
      }

      negateNext = false;
      intensify = false;
    }

    const rawScore = positiveScore - negativeScore;
    const maxPossible = Math.max(totalSentimentWords, 1);
    const normalizedScore = Math.max(-1, Math.min(1, rawScore / maxPossible));
    const confidence = Math.min(1, totalSentimentWords / Math.max(words.length * 0.1, 3));

    let label = 'neutral';
    if (normalizedScore > 0.15) label = 'positive';
    else if (normalizedScore < -0.15) label = 'negative';

    return {
      score: Math.round(normalizedScore * 100) / 100,
      label,
      confidence: Math.round(confidence * 100) / 100,
      positive: Math.round(positiveScore * 10) / 10,
      negative: Math.round(negativeScore * 10) / 10
    };
  }
}


// =====================================================
// PART 2: GENRE CLASSIFIER
// =====================================================

const GENRES = {
  'action-required': {
    label: 'Action Required',
    icon: '⚡',
    color: '#E53E3E',
    patterns: [
      /\b(?:action\s*(?:required|needed|item)|approval\s*(?:needed|required|pending))\b/i,
      /\b(?:please\s*(?:approve|confirm|review|sign|submit|respond|complete|fill))\b/i,
      /\b(?:waiting\s*(?:on|for)\s*(?:you|your))\b/i,
      /\b(?:rsvp|confirm\s*(?:your|attendance))\b/i,
      /\b(?:pending\s*your|needs?\s*your\s*(?:input|review|approval|signature))\b/i
    ]
  },
  'transactional': {
    label: 'Transactional',
    icon: '🧾',
    color: '#38A169',
    patterns: [
      /\b(?:order\s*(?:confirm|ship|deliver|track|#\d+)|tracking\s*(?:number|id|#))\b/i,
      /\b(?:receipt|invoice|payment\s*(?:confirm|received|processed))\b/i,
      /\b(?:subscription\s*(?:confirm|renew|cancel)|billing\s*(?:statement|summary))\b/i,
      /\b(?:shipping\s*(?:confirm|update|notification))\b/i,
      /\b(?:refund|return\s*(?:confirm|processed|approved))\b/i
    ]
  },
  'conversational': {
    label: 'Conversational',
    icon: '💬',
    color: '#3182CE',
    patterns: [
      /^re:\s/i,
      /\b(?:hey|hi|hello|good\s*(?:morning|afternoon|evening))\b/i,
      /\b(?:how\s*are\s*you|hope\s*you(?:'re|\s*are)\s*(?:well|doing|good))\b/i,
      /\b(?:thanks|thank\s*you|cheers|best\s*regards|kind\s*regards)\b/i,
      /\b(?:let'?s\s*(?:chat|talk|discuss|catch\s*up|meet)|want\s*to\s*(?:chat|catch\s*up))\b/i
    ]
  },
  'informational': {
    label: 'Informational',
    icon: '📋',
    color: '#805AD5',
    patterns: [
      /\b(?:update|report|summary|digest|weekly|monthly|quarterly)\b/i,
      /\b(?:announcement|news|bulletin|release\s*notes)\b/i,
      /\b(?:fyi|for\s*your\s*(?:information|reference|review))\b/i,
      /\b(?:status\s*(?:update|report)|progress\s*(?:update|report))\b/i
    ]
  },
  'promotional': {
    label: 'Promotional',
    icon: '📢',
    color: '#DD6B20',
    patterns: [
      /\b(?:sale|discount|coupon|promo(?:tion)?|deal|offer|save\s*\d+%)\b/i,
      /\b(?:limited\s*time|exclusive|special\s*offer|free\s*(?:shipping|trial|gift))\b/i,
      /\b(?:shop\s*now|buy\s*now|order\s*now|get\s*(?:it|yours)\s*(?:now|today))\b/i,
      /\b(?:unsubscribe|email\s*preferences|opt[- ]?out)\b/i
    ]
  },
  'automated': {
    label: 'Automated',
    icon: '🤖',
    color: '#718096',
    patterns: [
      /\b(?:noreply|no[- ]?reply|donotreply|do[- ]?not[- ]?reply|automated|auto[- ]?generated)\b/i,
      /\b(?:verification\s*code|security\s*code|one[- ]?time\s*(?:password|code|pin))\b/i,
      /\b(?:password\s*reset|login\s*(?:alert|notification)|new\s*sign[- ]?in)\b/i,
      /\b(?:this\s*is\s*an?\s*(?:automated|auto[- ]?generated)\s*(?:message|email|notification))\b/i
    ]
  }
};


// =====================================================
// PART 3: CATEGORY DEFINITIONS (Enhanced)
// =====================================================

const CATEGORY_DEFINITIONS = {
  'school': {
    priority: 3,
    keywords: [
      // Tier 1: Exams & deadlines (highest weight)
      'due date', 'due dates', 'deadline', 'deadlines', 'exam', 'exams',
      'test', 'tests', 'quiz', 'quizzes', 'midterm', 'midterms',
      'final', 'finals', 'assignment', 'assignments', 'homework',
      'submission', 'submissions', 'paper due', 'project due',
      // Tier 2: Grades & courses
      'grade', 'grades', 'gpa', 'course', 'courses', 'class', 'classes',
      'lecture', 'lectures', 'professor', 'professors', 'prof',
      'instructor', 'teaching assistant', 'ta',
      // Tier 3: Academic admin
      'registration', 'enrollment', 'student', 'education',
      'transcript', 'degree', 'credit', 'credits', 'semester',
      // Tier 4: Platforms & institutions
      'university', 'college', 'campus', 'tuition', 'financial aid',
      'scholarship', 'blackboard', 'canvas', 'moodle', 'coursework',
      'syllabus', 'piazza', 'gradescope', 'turnitin', 'chegg'
    ],
    domains: ['edu', 'school', 'university', 'college', 'instructure.com', 'blackboard.com'],
    subCategories: {
      'exams': ['exam', 'exams', 'test', 'tests', 'quiz', 'quizzes', 'midterm', 'final', 'finals'],
      'assignments': ['assignment', 'homework', 'submission', 'paper due', 'project due', 'coursework', 'due date'],
      'grades': ['grade', 'grades', 'gpa', 'transcript', 'score', 'graded', 'feedback'],
      'enrollment': ['registration', 'enrollment', 'enroll', 'drop', 'add', 'waitlist', 'course selection'],
      'campus': ['campus', 'event', 'club', 'organization', 'student life', 'housing', 'dining']
    }
  },
  'work-current': {
    priority: 4,
    keywords: [
      // Tier 1: Urgent work items
      'deadline', 'deadlines', 'urgent', 'asap', 'action items', 'action item',
      'action required', 'action needed', 'follow up', 'follow-up', 'blocker',
      'blocked', 'critical bug', 'hotfix', 'production issue', 'incident',
      // Tier 2: Meetings & collaboration
      'meeting', 'meetings', 'standup', 'stand-up', 'retro', 'retrospective',
      'sprint', 'sprint review', 'sprint planning', 'sync', '1:1', 'one-on-one',
      'agenda', 'minutes', 'calendar invite',
      // Tier 3: Code & development
      'code review', 'pull request', 'PR review', 'merge', 'deploy', 'deployment',
      'release', 'staging', 'production', 'commit', 'branch', 'repository',
      'build', 'pipeline', 'ci/cd', 'test failure', 'bug', 'issue',
      // Tier 4: Project management
      'project', 'task', 'ticket', 'jira', 'confluence', 'trello', 'asana',
      'notion', 'slack', 'teams', 'zoom', 'google meet', 'report',
      'quarterly', 'okr', 'kpi', 'roadmap', 'milestone',
      // Tier 5: General work
      'team', 'department', 'org', 'company', 'office', 'workplace',
      'colleague', 'coworker', 'manager', 'director', 'leadership',
      // Tier 6: HR & admin
      'payroll', 'timesheet', 'time off', 'pto', 'vacation request',
      'performance review', 'feedback', 'evaluation', 'onboarding',
      'benefits', 'open enrollment', 'expense report', 'reimbursement'
    ],
    domains: ['slack.com', 'atlassian.net', 'atlassian.com', 'jira.com', 'trello.com',
              'asana.com', 'notion.so', 'monday.com', 'clickup.com', 'linear.app',
              'github.com', 'gitlab.com', 'bitbucket.org', 'figma.com'],
    subCategories: {
      'meetings': ['meeting', 'standup', 'sync', '1:1', 'retro', 'agenda', 'calendar invite', 'zoom', 'google meet'],
      'code-review': ['code review', 'pull request', 'PR', 'merge', 'commit', 'branch', 'diff'],
      'deployments': ['deploy', 'deployment', 'release', 'staging', 'production', 'build', 'pipeline'],
      'incidents': ['incident', 'outage', 'critical bug', 'hotfix', 'production issue', 'on-call', 'pager'],
      'projects': ['project', 'sprint', 'milestone', 'roadmap', 'task', 'ticket', 'backlog'],
      'team-updates': ['update', 'report', 'status', 'announcement', 'newsletter', 'digest']
    }
  },
  'work-opportunities': {
    priority: 3,
    keywords: [
      // Tier 1: Active opportunities
      'interview', 'interview scheduled', 'phone screen', 'onsite',
      'offer', 'offer letter', 'compensation', 'salary',
      // Tier 2: Applications
      'application', 'applied', 'job application', 'application received',
      'application status', 'application update', 'resume', 'cv',
      // Tier 3: Recruitment
      'recruiter', 'recruiting', 'talent', 'hiring manager',
      'job opening', 'position', 'role', 'opportunity',
      'career', 'careers', 'job board',
      // Tier 4: Platforms
      'linkedin', 'indeed', 'glassdoor', 'angellist', 'wellfound',
      'lever', 'greenhouse', 'workday', 'hired', 'dice',
      // Tier 5: General
      'employment', 'contractor', 'freelance', 'gig',
      'internship', 'intern', 'fellowship', 'apprenticeship'
    ],
    domains: ['linkedin.com', 'indeed.com', 'glassdoor.com', 'lever.co', 'greenhouse.io',
              'myworkday.com', 'smartrecruiters.com', 'icims.com', 'workable.com',
              'hired.com', 'wellfound.com', 'angellist.co', 'dice.com'],
    subCategories: {
      'applications': ['application', 'applied', 'application received', 'application status', 'resume'],
      'interviews': ['interview', 'phone screen', 'onsite', 'technical', 'coding challenge'],
      'offers': ['offer', 'offer letter', 'compensation', 'salary', 'benefits', 'package'],
      'networking': ['recruiter', 'connect', 'opportunity', 'referral', 'recommendation']
    }
  },
  'finance': {
    priority: 4,
    keywords: [
      // Tier 1: Urgent financial
      'payment due', 'overdue', 'past due', 'late fee', 'penalty',
      'fraud alert', 'suspicious activity', 'unauthorized',
      'payment failed', 'declined', 'insufficient funds',
      // Tier 2: Bills & banking
      'invoice', 'bill', 'billing', 'statement', 'balance',
      'payment', 'transfer', 'deposit', 'withdrawal',
      'bank', 'banking', 'account', 'credit card',
      // Tier 3: Financial services
      'mortgage', 'loan', 'insurance', 'premium', 'claim',
      'tax', 'taxes', 'w-2', '1099', 'refund', 'irs',
      'investment', 'portfolio', 'stock', 'dividend',
      // Tier 4: Platforms
      'paypal', 'venmo', 'zelle', 'stripe', 'square',
      'chase', 'wells fargo', 'bank of america', 'citi',
      'amex', 'visa', 'mastercard', 'discover',
      'mint', 'plaid', 'robinhood', 'fidelity', 'vanguard',
      // Tier 5: Transactions
      'receipt', 'purchase', 'transaction', 'charge',
      'subscription', 'renewal', 'autopay', 'direct debit'
    ],
    domains: ['chase.com', 'wellsfargo.com', 'bankofamerica.com', 'citi.com',
              'capitalone.com', 'paypal.com', 'venmo.com', 'stripe.com',
              'intuit.com', 'turbotax.com', 'mint.com', 'fidelity.com',
              'vanguard.com', 'schwab.com', 'robinhood.com', 'coinbase.com'],
    subCategories: {
      'bills': ['bill', 'billing', 'payment due', 'invoice', 'statement', 'autopay'],
      'banking': ['bank', 'transfer', 'deposit', 'withdrawal', 'balance', 'account'],
      'investments': ['investment', 'portfolio', 'stock', 'dividend', 'market', 'trading'],
      'taxes': ['tax', 'taxes', 'w-2', '1099', 'irs', 'refund', 'deduction'],
      'receipts': ['receipt', 'purchase', 'transaction', 'charge', 'order confirm']
    }
  },
  'personal': {
    priority: 2,
    keywords: [
      // Tier 1: Close relationships
      'family', 'mom', 'dad', 'parent', 'parents', 'brother', 'sister',
      'son', 'daughter', 'husband', 'wife', 'spouse', 'partner',
      // Tier 2: Events
      'birthday', 'wedding', 'anniversary', 'party', 'celebration',
      'holiday', 'vacation', 'trip', 'gathering', 'reunion',
      'baby shower', 'graduation', 'housewarming', 'funeral', 'memorial',
      // Tier 3: Social
      'dinner', 'lunch', 'brunch', 'coffee', 'drinks',
      'weekend', 'plans', 'hangout', 'catch up',
      'friend', 'friends', 'bestie', 'roommate',
      // Tier 4: Health & Wellness
      'appointment', 'doctor', 'dentist', 'therapy', 'wellness',
      'prescription', 'lab results', 'test results', 'diagnosis',
      'checkup', 'physical', 'vaccination', 'vaccine', 'immunization',
      'pharmacy', 'medication', 'referral', 'specialist',
      'mental health', 'counselor', 'psychologist',
      // Tier 5: Personal services
      'reservation', 'booking', 'gym', 'fitness', 'personal trainer',
      'pet', 'vet', 'grooming', 'daycare', 'childcare',
      'mechanic', 'repair', 'maintenance', 'plumber', 'electrician',
      'moving', 'storage', 'cleaning service'
    ],
    domains: ['evite.com', 'paperlesspost.com', 'theknot.com', 'zola.com',
              'zocdoc.com', 'mycharthealth.com', 'onemedical.com', 'mychart.com'],
    subCategories: {
      'family': ['family', 'mom', 'dad', 'parent', 'brother', 'sister', 'son', 'daughter'],
      'events': ['birthday', 'wedding', 'party', 'celebration', 'graduation', 'anniversary'],
      'social': ['dinner', 'lunch', 'coffee', 'drinks', 'weekend', 'plans', 'friend', 'hangout'],
      'health': ['doctor', 'dentist', 'appointment', 'prescription', 'therapy', 'lab results', 'health'],
      'travel': ['flight', 'hotel', 'booking', 'reservation', 'itinerary', 'trip', 'vacation', 'airbnb']
    }
  },
  'news': {
    priority: 1,
    keywords: [
      'breaking news', 'headline', 'headlines', 'top stories',
      'daily briefing', 'morning briefing', 'evening briefing',
      'news alert', 'news digest', 'weekly digest',
      'industry news', 'market news', 'tech news',
      'the morning', 'the daily', 'the weekly',
      'editorial', 'opinion', 'analysis', 'commentary',
      'newsletter', 'digest', 'roundup', 'wrap-up'
    ],
    domains: ['nytimes.com', 'wsj.com', 'washingtonpost.com', 'cnn.com', 'bbc.com',
              'bbc.co.uk', 'reuters.com', 'apnews.com', 'bloomberg.com', 'ft.com',
              'theguardian.com', 'axios.com', 'politico.com', 'theatlantic.com',
              'newyorker.com', 'vox.com', 'techcrunch.com', 'theverge.com',
              'arstechnica.com', 'wired.com', 'substack.com', 'medium.com',
              'morningbrew.com', 'theskim.com', 'themorningbrew.com'],
    senderPatterns: [
      /newsletter/i, /digest/i, /briefing/i, /daily/i, /weekly/i,
      /news@/i, /editor/i, /editorial/i
    ],
    subCategories: {
      'breaking': ['breaking news', 'alert', 'developing', 'just in'],
      'tech': ['tech', 'technology', 'startup', 'ai', 'software', 'hardware', 'gadget'],
      'business': ['market', 'stock', 'economy', 'business', 'finance', 'industry'],
      'politics': ['politics', 'election', 'government', 'policy', 'congress', 'senate'],
      'digest': ['digest', 'roundup', 'briefing', 'summary', 'wrap', 'weekly', 'daily']
    }
  },
  'travel': {
    priority: 3,
    keywords: [
      // Tier 1: Active travel
      'flight', 'flights', 'boarding pass', 'check-in', 'gate',
      'itinerary', 'booking confirmation', 'e-ticket', 'departure',
      'arrival', 'layover', 'connection', 'delay', 'cancellation',
      // Tier 2: Accommodation
      'hotel', 'reservation', 'checkout', 'airbnb',
      'vrbo', 'resort', 'lodge', 'hostel', 'villa', 'apartment rental',
      // Tier 3: Transportation
      'rental car', 'uber', 'lyft', 'taxi', 'train', 'bus',
      'cruise', 'ferry', 'amtrak', 'eurostar',
      // Tier 4: Travel services
      'passport', 'visa', 'tsa', 'customs', 'immigration',
      'travel insurance', 'trip protection', 'global entry', 'tsa precheck',
      'currency exchange', 'travel advisory',
      // Tier 5: Platforms
      'expedia', 'kayak', 'google flights', 'southwest', 'delta',
      'united', 'american airlines', 'jetblue', 'spirit', 'frontier',
      'marriott', 'hilton', 'hyatt', 'skyscanner', 'hopper',
      'tripadvisor', 'lonely planet', 'trip.com', 'agoda'
    ],
    domains: ['expedia.com', 'booking.com', 'airbnb.com', 'kayak.com',
              'southwest.com', 'delta.com', 'united.com', 'aa.com',
              'jetblue.com', 'marriott.com', 'hilton.com', 'hyatt.com',
              'hotels.com', 'tripadvisor.com', 'vrbo.com', 'hostelworld.com',
              'flightradar24.com', 'google.com/travel'],
    subCategories: {
      'flights': ['flight', 'boarding pass', 'gate', 'airline', 'layover', 'departure', 'arrival'],
      'hotels': ['hotel', 'reservation', 'check-in', 'checkout', 'room', 'resort'],
      'bookings': ['booking', 'confirmation', 'itinerary', 'reservation'],
      'transport': ['rental car', 'uber', 'lyft', 'train', 'bus', 'cruise']
    }
  },
  'auth-codes': {
    priority: 1,
    keywords: [
      'verification code', 'security code', 'one-time password',
      'otp', '2fa', 'two-factor', 'two factor', 'mfa',
      'authentication code', 'login code', 'sign-in code',
      'confirm your email', 'verify your email', 'verify your account',
      'reset your password', 'password reset', 'new password',
      'confirm your identity', 'security alert', 'new sign-in',
      'login attempt', 'suspicious sign-in'
    ],
    domains: [],
    codePatterns: [
      /\b\d{4,8}\b/,
      /\b[A-Z0-9]{6,8}\b/
    ],
    subCategories: {}
  },
  'promo': {
    priority: 1,
    keywords: [
      // Tier 1: Sales
      'sale', 'sales', 'discount', 'coupon', 'promo', 'promo code',
      'deal', 'deals', 'offer', 'offers', 'save', 'savings',
      '% off', 'percent off', 'half off', 'bogo', 'clearance',
      // Tier 2: Marketing
      'limited time', 'exclusive', 'special offer', 'don\'t miss',
      'shop now', 'buy now', 'order now', 'act now', 'hurry',
      'free shipping', 'free trial', 'free gift', 'giveaway',
      // Tier 3: Newsletters
      'unsubscribe', 'email preferences', 'opt out', 'opt-out',
      'manage subscriptions', 'update preferences',
      'weekly picks', 'editors choice', 'trending',
      // Tier 4: Social/Engagement
      'we miss you', 'come back', 'haven\'t seen you',
      'new arrivals', 'just dropped', 'new collection',
      'reward', 'rewards', 'loyalty', 'points', 'cashback',
      'referral', 'refer a friend', 'invite'
    ],
    domains: [],
    subCategories: {
      'sales': ['sale', 'discount', 'coupon', 'deal', 'offer', 'save', 'clearance', '% off'],
      'newsletters': ['newsletter', 'digest', 'weekly', 'monthly', 'update', 'unsubscribe'],
      'social-media': ['liked', 'followed', 'mentioned', 'tagged', 'commented', 'shared', 'friend request'],
      'subscriptions': ['subscription', 'renewal', 'trial', 'premium', 'upgrade', 'plan']
    }
  },
  'other': {
    priority: 1,
    keywords: [],
    domains: [],
    subCategories: {}
  }
};


// =====================================================
// PART 4: EMAIL CLASSIFIER
// =====================================================

class EmailClassifier {
  constructor() {
    this.nlp = new NLPEngine();
    this.categories = CATEGORY_DEFINITIONS;
    this.genres = GENRES;

    // Build keyword lookup for all categories (for TF-IDF)
    this._allCategoryKeywords = {};
    for (const [cat, def] of Object.entries(this.categories)) {
      this._allCategoryKeywords[cat] = def.keywords || [];
    }

    // Non-human sender patterns
    this._nonHumanPatterns = [
      /^noreply@/i, /^no[_-]?reply@/i, /^donotreply@/i, /^do[_-]?not[_-]?reply@/i,
      /^mailer[_-]?daemon@/i, /^postmaster@/i, /^notifications?@/i,
      /^alerts?@/i, /^info@/i, /^support@/i, /^help@/i,
      /^news@/i, /^updates?@/i, /^marketing@/i,
      /^digest@/i, /^newsletter@/i, /^hello@/i,
      /^bot@/i, /^automation@/i, /^system@/i, /^admin@/i
    ];

    // News source senders for direct detection
    this._newsSources = new Set([
      'nytimes.com', 'wsj.com', 'washingtonpost.com', 'cnn.com', 'bbc.com',
      'bbc.co.uk', 'reuters.com', 'apnews.com', 'bloomberg.com', 'ft.com',
      'theguardian.com', 'axios.com', 'politico.com', 'theatlantic.com',
      'morningbrew.com', 'theskim.com', 'substack.com', 'medium.com',
      'techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com',
      'vox.com', 'newyorker.com'
    ]);

    // Sender authority patterns for priority boosting
    this._authorityPatterns = [
      [/\b(?:ceo|cto|cfo|coo|cio|cpo|chief)\b/i, 3],
      [/\b(?:president|founder|co-?founder|owner)\b/i, 3],
      [/\b(?:vp|vice\s*president|svp|evp)\b/i, 2.5],
      [/\b(?:director|head\s*of|dean|provost)\b/i, 2],
      [/\b(?:manager|lead|supervisor|principal)\b/i, 1.5],
      [/\b(?:professor|prof\.|dr\.|doctor)\b/i, 1.5],
      [/\b(?:sr\.|senior|staff)\b/i, 1],
    ];
  }

  // ===================================================
  // MAIN CLASSIFICATION METHOD
  // ===================================================
  classify(email) {
    const subject = (email.subject || '').trim();
    const from = (email.from || '').trim();
    const body = (email.body || '').trim();
    const fullText = subject + ' ' + body;
    const fromLower = from.toLowerCase();

    // Check for category overrides first (user corrections)
    // (handled externally in content.js)

    // Detect non-human senders
    const isNonHuman = this._isNonHuman(fromLower);

    // Quick check: auth codes (high confidence, fast path)
    const authResult = this._detectAuthCode(subject, body, fromLower);
    if (authResult.match) {
      return this._buildResult('auth-codes', email, {
        isNonHuman: true,
        isNewsletter: false,
        genre: 'automated',
        subCategory: '',
        confidence: authResult.confidence
      });
    }

    // Quick check: newsletter / promo detection
    const isNewsletter = this._detectNewsletter(fromLower, fullText);

    // Detect genre
    const genre = this._detectGenre(subject, fullText, fromLower, isNonHuman);

    // Check for news sources (fast path)
    const newsResult = this._detectNewsSource(fromLower, subject);
    if (newsResult.match) {
      return this._buildResult('news', email, {
        isNonHuman,
        isNewsletter: true,
        genre: 'informational',
        subCategory: newsResult.subCategory || 'digest',
        breakingNews: newsResult.breaking,
        confidence: newsResult.confidence
      });
    }

    // Multi-pass classification
    const classificationResult = this._classifyMultiPass(email, fullText, fromLower, isNonHuman);

    // Determine sub-category
    const subCategory = this._detectSubCategory(classificationResult.category, fullText);

    // Override: if classified as school/work but has strong promo signals
    let finalCategory = classificationResult.category;
    if (isNewsletter && !['promo', 'news', 'auth-codes'].includes(finalCategory)) {
      // Check if it's genuinely important or just a newsletter
      if (classificationResult.confidence < 6 || genre === 'promotional') {
        finalCategory = 'promo';
      }
    }

    return this._buildResult(finalCategory, email, {
      isNonHuman,
      isNewsletter,
      genre,
      subCategory,
      confidence: classificationResult.confidence,
      scores: classificationResult.scores
    });
  }

  // Build the full result object
  _buildResult(category, email, extra = {}) {
    const subject = (email.subject || '').trim();
    const body = (email.body || '').trim();
    const from = (email.from || '').trim();
    const fullText = subject + ' ' + body;

    // Calculate priority
    const priority = this._calculatePriority(category, email, extra);

    // Calculate star rating
    const starRating = this._calculateStarRating(priority, fullText, extra);

    // Extract entities
    const entities = this.nlp.extractEntities(fullText);

    // Urgency analysis
    const urgency = this.nlp.analyzeUrgency(fullText);

    // Generate summary
    const summary = this.nlp.summarize(subject, body);

    // Sentiment analysis
    const sentiment = this.nlp.analyzeSentiment(fullText);

    // Important info (backward compatible format)
    const importantInfo = {
      dates: entities.dates.slice(0, 3),
      money: entities.money.slice(0, 3),
      links: entities.urls.slice(0, 5),
      tasks: entities.actionItems.slice(0, 5),
      phones: entities.phones.slice(0, 2),
      actionItems: entities.actionItems.slice(0, 3)
    };

    return {
      category,
      priority,
      starRating,
      genre: extra.genre || 'informational',
      genreLabel: GENRES[extra.genre]?.label || extra.genre || 'Other',
      genreIcon: GENRES[extra.genre]?.icon || '📧',
      genreColor: GENRES[extra.genre]?.color || '#718096',
      subCategory: extra.subCategory || '',
      isNewsletter: extra.isNewsletter || false,
      isNonHuman: extra.isNonHuman || false,
      breakingNews: extra.breakingNews || false,
      importantInfo,
      urgency,
      sentiment,
      summary,
      confidence: extra.confidence || 0
    };
  }

  // ===================================================
  // CLASSIFICATION PASSES
  // ===================================================
  _classifyMultiPass(email, fullText, fromLower, isNonHuman) {
    const subject = (email.subject || '').trim();
    const body = (email.body || '').trim();

    // Pass 1: Domain-based (high confidence)
    const domainResult = this._classifyByDomain(fromLower);
    if (domainResult.confidence >= 7) {
      return domainResult;
    }

    // Pass 2: Subject-only keywords (fast)
    const subjectResult = this._classifyByKeywords(subject, fromLower);
    if (subjectResult.confidence >= 8) {
      return subjectResult;
    }

    // Pass 3: Subject + TF-IDF scoring
    const tfidfSubjectResult = this._classifyByTFIDF(subject);
    if (tfidfSubjectResult.confidence >= 7) {
      return tfidfSubjectResult;
    }

    // Pass 4: Full text analysis (subject + body)
    if (body) {
      const fullResult = this._classifyByKeywords(fullText, fromLower);
      if (fullResult.confidence >= 5) {
        return fullResult;
      }

      const tfidfFullResult = this._classifyByTFIDF(fullText);
      if (tfidfFullResult.confidence >= 5) {
        return tfidfFullResult;
      }
    }

    // Pass 5: Progressive body analysis
    if (body) {
      const lines = body.split(/[\n\r]+/).filter(l => l.trim());
      for (let i = 1; i <= Math.min(lines.length, 5); i++) {
        const partial = subject + ' ' + lines.slice(0, i).join(' ');
        const partialResult = this._classifyByKeywords(partial, fromLower);
        if (partialResult.confidence >= 5) {
          return partialResult;
        }
      }
    }

    // Pass 6: Combine all signals for best guess
    const combined = this._combineSignals(
      domainResult, subjectResult, tfidfSubjectResult
    );

    if (combined.confidence >= 3) {
      return combined;
    }

    // Default: other
    return { category: 'other', confidence: 1, scores: {} };
  }

  // Domain-based classification
  _classifyByDomain(fromLower) {
    const emailDomain = fromLower.split('@')[1] || '';

    for (const [category, def] of Object.entries(this.categories)) {
      if (!def.domains || def.domains.length === 0) continue;

      for (const domain of def.domains) {
        if (emailDomain.includes(domain) || emailDomain.endsWith('.' + domain)) {
          return { category, confidence: 8, scores: { [category]: 8 } };
        }
      }
    }

    // Check news sources specifically
    for (const domain of this._newsSources) {
      if (emailDomain.includes(domain)) {
        return { category: 'news', confidence: 9, scores: { news: 9 } };
      }
    }

    return { category: 'other', confidence: 0, scores: {} };
  }

  // Keyword-based classification with ranking
  _classifyByKeywords(text, fromLower) {
    if (!text) return { category: 'other', confidence: 0, scores: {} };

    const lower = text.toLowerCase();
    const scores = {};
    let bestCategory = 'other';
    let bestScore = 0;

    for (const [category, def] of Object.entries(this.categories)) {
      if (!def.keywords || def.keywords.length === 0) continue;

      let score = 0;
      const totalKeywords = def.keywords.length;

      for (let i = 0; i < totalKeywords; i++) {
        const keyword = def.keywords[i].toLowerCase();

        if (lower.includes(keyword)) {
          // Position-weighted scoring: earlier keywords = more important
          const positionWeight = 1.0 - (i / totalKeywords) * 0.7;

          // Keyword length bonus (longer = more specific = higher weight)
          const lengthBonus = Math.min(keyword.split(' ').length * 0.5, 1.5);

          // Subject match bonus (keywords in subject are more relevant)
          const subjectBonus = lower.indexOf(keyword) < ((text.split('\n')[0] || '').length) ? 1.5 : 1.0;

          score += positionWeight * lengthBonus * subjectBonus;
        }
      }

      // Domain affinity bonus
      if (def.domains) {
        const emailDomain = (fromLower.split('@')[1] || '');
        for (const domain of def.domains) {
          if (emailDomain.includes(domain)) {
            score += 3;
            break;
          }
        }
      }

      scores[category] = score;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Confidence mapping
    let confidence = 0;
    if (bestScore >= 6) confidence = 9;
    else if (bestScore >= 4) confidence = 8;
    else if (bestScore >= 3) confidence = 7;
    else if (bestScore >= 2) confidence = 5;
    else if (bestScore >= 1) confidence = 3;
    else confidence = 0;

    return { category: bestCategory, confidence, scores };
  }

  // TF-IDF based classification
  _classifyByTFIDF(text) {
    if (!text) return { category: 'other', confidence: 0, scores: {} };

    const tokens = this.nlp.tokenize(text);
    // Include bigrams for phrase matching
    const bigrams = this.nlp.ngrams(tokens, 2);
    const allTokens = [...tokens, ...bigrams];

    const scores = {};
    let bestCategory = 'other';
    let bestScore = 0;

    for (const [category, def] of Object.entries(this.categories)) {
      if (!def.keywords || def.keywords.length === 0) continue;

      const score = this.nlp.tfidfScore(allTokens, def.keywords, this._allCategoryKeywords);
      scores[category] = score;

      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    let confidence = 0;
    if (bestScore >= 3.0) confidence = 9;
    else if (bestScore >= 2.0) confidence = 7;
    else if (bestScore >= 1.0) confidence = 5;
    else if (bestScore >= 0.5) confidence = 3;

    return { category: bestCategory, confidence, scores };
  }

  // Combine multiple classification signals
  _combineSignals(...results) {
    const combinedScores = {};

    for (const result of results) {
      if (!result.scores) continue;
      for (const [cat, score] of Object.entries(result.scores)) {
        combinedScores[cat] = (combinedScores[cat] || 0) + score;
      }
    }

    let bestCategory = 'other';
    let bestScore = 0;

    for (const [cat, score] of Object.entries(combinedScores)) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = cat;
      }
    }

    return {
      category: bestCategory,
      confidence: Math.min(bestScore, 10),
      scores: combinedScores
    };
  }

  // ===================================================
  // DETECTION METHODS
  // ===================================================

  _isNonHuman(fromLower) {
    return this._nonHumanPatterns.some(p => p.test(fromLower));
  }

  _detectAuthCode(subject, body, fromLower) {
    const text = (subject + ' ' + body).toLowerCase();

    // Check for auth code keywords
    const authKeywords = ['verification code', 'security code', 'one-time',
      'otp', '2fa', 'two-factor', 'mfa', 'authentication code',
      'login code', 'sign-in code', 'confirm your email',
      'verify your email', 'verify your account', 'reset your password',
      'password reset'];

    let keywordMatch = false;
    for (const kw of authKeywords) {
      if (text.includes(kw)) {
        keywordMatch = true;
        break;
      }
    }

    // Check for numeric code pattern in subject
    const hasCode = /\b\d{4,8}\b/.test(subject) || /\b[A-Z0-9]{6,8}\b/.test(subject);

    if (keywordMatch && hasCode) {
      return { match: true, confidence: 10 };
    }
    if (keywordMatch) {
      return { match: true, confidence: 8 };
    }
    if (hasCode && this._isNonHuman(fromLower)) {
      // Numeric code from automated sender
      const codeInSubject = /(?:code|pin|otp|token)[:\s]*\d{4,8}/i.test(subject);
      if (codeInSubject) return { match: true, confidence: 9 };
    }

    return { match: false, confidence: 0 };
  }

  _detectNewsletter(fromLower, text) {
    const lower = text.toLowerCase();

    // Sender-based detection
    if (/newsletter|digest|bulletin|weekly|daily|briefing/.test(fromLower)) return true;
    if (this._isNonHuman(fromLower) && /unsubscribe/i.test(lower)) return true;

    // Content-based detection
    if (/\bunsubscribe\b/i.test(lower)) return true;
    if (/\bemail\s*preferences\b/i.test(lower)) return true;
    if (/\bview\s*(?:in|this\s*email\s*in)\s*(?:your\s*)?browser\b/i.test(lower)) return true;
    if (/\bmanage\s*(?:your\s*)?subscriptions?\b/i.test(lower)) return true;

    return false;
  }

  _detectNewsSource(fromLower, subject) {
    const emailDomain = (fromLower.split('@')[1] || '');

    for (const domain of this._newsSources) {
      if (emailDomain.includes(domain)) {
        const breaking = /\bbreaking\b/i.test(subject);
        const subCategory = breaking ? 'breaking' : 'digest';
        return { match: true, confidence: 9, subCategory, breaking };
      }
    }

    // Check sender patterns for news
    if (/\bnews\b/i.test(fromLower) && /\b(?:daily|weekly|morning|evening|digest|briefing)\b/i.test(subject)) {
      return { match: true, confidence: 7, subCategory: 'digest', breaking: false };
    }

    return { match: false, confidence: 0 };
  }

  _detectGenre(subject, fullText, fromLower, isNonHuman) {
    const text = (subject + ' ' + fullText).toLowerCase();

    // Score each genre
    let bestGenre = 'informational';
    let bestScore = 0;

    for (const [genre, def] of Object.entries(this.genres)) {
      let score = 0;
      for (const pattern of def.patterns) {
        if (pattern.test(text)) {
          score += 2;
        }
      }

      // Bonus for sender-based signals
      if (genre === 'automated' && isNonHuman) score += 3;
      if (genre === 'conversational' && !isNonHuman && /^re:/i.test(subject)) score += 3;
      if (genre === 'promotional' && /unsubscribe/i.test(text)) score += 2;

      if (score > bestScore) {
        bestScore = score;
        bestGenre = genre;
      }
    }

    return bestGenre;
  }

  _detectSubCategory(category, text) {
    const def = this.categories[category];
    if (!def || !def.subCategories) return '';

    const lower = text.toLowerCase();
    let bestSub = '';
    let bestScore = 0;

    for (const [sub, keywords] of Object.entries(def.subCategories)) {
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw.toLowerCase())) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestSub = sub;
      }
    }

    return bestSub;
  }

  // ===================================================
  // PRIORITY SCORING (Multi-Signal)
  // ===================================================
  _calculatePriority(category, email, extra) {
    const subject = (email.subject || '').trim();
    const body = (email.body || '').trim();
    const from = (email.from || '').trim();
    const fullText = subject + ' ' + body;
    const lower = fullText.toLowerCase();

    // Start with category base priority
    let basePriority = this.categories[category]?.priority || 1;

    // ---- Signal 1: Urgency Language ----
    const urgency = this.nlp.analyzeUrgency(fullText);
    let urgencyBoost = 0;
    if (urgency.score >= 8) urgencyBoost = 2;
    else if (urgency.score >= 5) urgencyBoost = 1.5;
    else if (urgency.score >= 3) urgencyBoost = 1;
    else if (urgency.score >= 1) urgencyBoost = 0.5;

    // ---- Signal 2: Action Required ----
    let actionBoost = 0;
    if (extra.genre === 'action-required') actionBoost = 1.5;
    else if (/\b(?:action\s*required|please\s*(?:respond|reply|review|approve|confirm))\b/i.test(lower)) {
      actionBoost = 1;
    }

    // ---- Signal 3: Sender Authority ----
    let authorityBoost = 0;
    for (const [pattern, weight] of this._authorityPatterns) {
      if (pattern.test(from)) {
        authorityBoost = Math.max(authorityBoost, weight * 0.5);
      }
    }

    // .edu domain boost for school category
    if (category === 'school' && /.edu/i.test(from)) {
      authorityBoost += 0.5;
    }

    // ---- Signal 4: Deadline Proximity ----
    let deadlineBoost = 0;
    if (/\b(?:today|tonight|eod|end\s*of\s*day|within\s*\d+\s*hours?)\b/i.test(lower)) {
      deadlineBoost = 1.5;
    } else if (/\b(?:tomorrow|by\s*(?:eow|end\s*of\s*week|friday|monday))\b/i.test(lower)) {
      deadlineBoost = 1;
    } else if (/\b(?:this\s*week|next\s*(?:few\s*)?days?|within\s*\d+\s*days?)\b/i.test(lower)) {
      deadlineBoost = 0.5;
    }

    // ---- Signal 5: Consequence Severity ----
    let consequenceBoost = 0;
    const consequencePatterns = [
      [/\b(?:overdue|past\s*due|late\s*fee|penalty|suspension|termination|expir)/i, 2],
      [/\b(?:fraud|unauthorized|security\s*(?:alert|breach)|compromised)\b/i, 2],
      [/\b(?:final\s*(?:notice|warning|reminder)|last\s*chance|account\s*(?:locked|suspended))\b/i, 1.5],
      [/\b(?:failure|failing|rejected|denied|cancelled|canceled)\b/i, 1]
    ];
    for (const [pattern, weight] of consequencePatterns) {
      if (pattern.test(lower)) {
        consequenceBoost = Math.max(consequenceBoost, weight);
      }
    }

    // ---- Signal 6: Financial Amount ----
    let financeBoost = 0;
    if (category === 'finance') {
      const amounts = lower.match(/\$[\d,]+(?:\.\d{2})?/g);
      if (amounts) {
        const maxAmount = Math.max(...amounts.map(a => parseFloat(a.replace(/[$,]/g, '')) || 0));
        if (maxAmount >= 1000) financeBoost = 1;
        else if (maxAmount >= 100) financeBoost = 0.5;
      }
    }

    // ---- Signal 7: Unread status ----
    let unreadBoost = (email.unread) ? 0.3 : 0;

    // ---- Signal 8: Personalization ----
    let personalBoost = 0;
    if (!extra.isNonHuman && !extra.isNewsletter) {
      personalBoost = 0.5; // Personal human-sent email
    }

    // ---- Calculate composite score ----
    const compositeScore =
      basePriority +
      urgencyBoost +
      actionBoost +
      authorityBoost +
      deadlineBoost +
      consequenceBoost +
      financeBoost +
      unreadBoost +
      personalBoost;

    // Map composite to 1-5 priority
    let priority;
    if (compositeScore >= 7.5) priority = 5;
    else if (compositeScore >= 5.5) priority = 4;
    else if (compositeScore >= 4.0) priority = 3;
    else if (compositeScore >= 2.5) priority = 2;
    else priority = 1;

    // Category floor: certain categories should never drop below a threshold
    if (category === 'work-current' && urgency.score > 0) priority = Math.max(priority, 3);
    if (category === 'finance' && consequenceBoost > 0) priority = Math.max(priority, 3);

    // Demotions for noise
    if (extra.isNewsletter && !extra.breakingNews) priority = Math.min(priority, 2);
    if (extra.isNonHuman && category === 'promo') priority = 1;
    if (category === 'auth-codes') priority = 1;
    if (category === 'news' && !extra.breakingNews) priority = Math.min(priority, 2);

    // Breaking news gets a small boost
    if (extra.breakingNews) priority = Math.max(priority, 2);

    return Math.max(1, Math.min(5, priority));
  }

  // ===================================================
  // STAR RATING (1-5 stars)
  // ===================================================
  _calculateStarRating(priority, fullText, extra) {
    // Stars are a refined version of priority that also considers
    // user-facing importance signals

    let score = priority; // Start from priority

    // Boost for action-required genre
    if (extra.genre === 'action-required') score += 0.5;

    // Boost for high urgency
    const urgency = this.nlp.analyzeUrgency(fullText);
    if (urgency.score >= 5) score += 0.5;

    // Penalty for noise
    if (extra.isNewsletter) score -= 0.5;
    if (extra.isNonHuman && extra.genre !== 'action-required') score -= 0.3;

    // Bonus for conversational (human) emails
    if (extra.genre === 'conversational') score += 0.3;

    // Map to 1-5
    return Math.max(1, Math.min(5, Math.round(score)));
  }

  // ===================================================
  // UTILITY METHODS
  // ===================================================

  getPriorityColor(priority) {
    const colors = {
      5: '#DC2626', // Red
      4: '#EA580C', // Orange
      3: '#D97706', // Amber
      2: '#65A30D', // Lime
      1: '#16A34A'  // Green
    };
    return colors[priority] || colors[1];
  }

  getStarColor(stars) {
    const colors = {
      5: '#DC2626', // Red - critical
      4: '#EA580C', // Orange - important
      3: '#D97706', // Amber - notable
      2: '#65A30D', // Lime - low
      1: '#9CA3AF'  // Gray - noise
    };
    return colors[stars] || colors[1];
  }

  getCategoryColor(category) {
    const colors = {
      'school': '#4A90E2',
      'work-current': '#E24A4A',
      'work-opportunities': '#E2A44A',
      'finance': '#4AE24A',
      'personal': '#E24AE2',
      'news': '#6366F1',
      'travel': '#0EA5E9',
      'auth-codes': '#A4A4A4',
      'promo': '#FFB84D',
      'other': '#808080'
    };
    return colors[category] || '#808080';
  }

  getCategoryLabel(category) {
    const labels = {
      'school': 'School',
      'work-current': 'Work',
      'work-opportunities': 'Jobs',
      'finance': 'Finance',
      'personal': 'Personal',
      'news': 'News',
      'travel': 'Travel',
      'auth-codes': 'Auth Code',
      'promo': 'Promo',
      'other': 'Other'
    };
    return labels[category] || 'Other';
  }

  getSubCategoryLabel(subCategory) {
    if (!subCategory) return '';
    return subCategory.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Render star rating as HTML string
  renderStars(starRating) {
    const filled = '★';
    const empty = '☆';
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= starRating ? filled : empty;
    }
    return html;
  }

  // Render star rating as colored HTML
  renderStarsHTML(starRating) {
    const color = this.getStarColor(starRating);
    const filled = '★';
    const empty = '☆';
    let html = `<span class="agileemails-stars" style="color: ${color}; letter-spacing: 1px;">`;
    for (let i = 1; i <= 5; i++) {
      html += i <= starRating ? filled : empty;
    }
    html += '</span>';
    return html;
  }

  // DND check (backward compatible)
  checkDNDRules(email, dndRules) {
    if (!dndRules || !Array.isArray(dndRules) || dndRules.length === 0) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const fromLower = (email.from || '').toLowerCase();
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();

    for (const rule of dndRules) {
      if (!rule.enabled) continue;

      let matches = false;

      // Time-based check
      if (rule.timeStart != null && rule.timeEnd != null) {
        if (rule.timeStart <= rule.timeEnd) {
          matches = currentHour >= rule.timeStart && currentHour < rule.timeEnd;
        } else {
          matches = currentHour >= rule.timeStart || currentHour < rule.timeEnd;
        }
      }

      // Sender-based check
      if (rule.senders && rule.senders.length > 0) {
        for (const sender of rule.senders) {
          if (fromLower.includes(sender.toLowerCase())) {
            matches = true;
            break;
          }
        }
      }

      if (!matches) continue;

      // Check exceptions
      if (rule.exceptions && rule.exceptions.length > 0) {
        for (const exception of rule.exceptions) {
          if (exception.type === 'urgent') {
            if (/\b(?:urgent|emergency|critical|asap|immediately)\b/i.test(subject + ' ' + body)) {
              return false; // Exception: don't DND
            }
          } else if (exception.type === 'deadline') {
            if (/\b(?:deadline|due\s*(?:today|tomorrow)|expires?\s*today)\b/i.test(subject + ' ' + body)) {
              return false;
            }
          } else if (exception.type === 'keyword' && exception.value) {
            if ((subject + ' ' + body).includes(exception.value.toLowerCase())) {
              return false;
            }
          }
        }
      }

      return true; // DND applies
    }

    return false;
  }

  // Backward-compatible extractImportantInfo
  extractImportantInfo(emailBody) {
    return this.nlp.extractEntities(emailBody || '');
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.EmailClassifier = EmailClassifier;
  window.NLPEngine = NLPEngine;
  window.GENRES = GENRES;
  window.CATEGORY_DEFINITIONS = CATEGORY_DEFINITIONS;
}
