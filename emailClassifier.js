// Email classification and priority scoring engine

class EmailClassifier {
  constructor() {
    this.categories = {
      'school': {
        // Keywords ranked by importance (most important first)
        keywords: [
          // Highest priority: exams, deadlines, assignments
          'due date', 'due dates', 'deadline', 'deadlines', 'exam', 'exams', 'test', 'tests', 'quiz', 'quizzes', 'midterm', 'midterms', 'final', 'finals',
          'assignment', 'assignments', 'homework', 'submission', 'submissions',
          // High priority: grades, courses, classes
          'grade', 'grades', 'gpa', 'course', 'courses', 'class', 'classes', 'lecture', 'lectures', 'professor', 'professors', 'prof',
          // Medium priority: enrollment, registration
          'registration', 'registrations', 'enrollment', 'enrollments', 'student', 'students', 'education', 'edu',
          // Lower priority: general school terms
          'university', 'universities', 'college', 'colleges', 'campus', 'tuition', 'financial aid', 'scholarship', 'scholarships',
          'blackboard', 'canvas', 'moodle', 'coursework', 'syllabus', 'syllabi'
        ],
        domains: ['edu', 'school', 'university', 'college'],
        priority: 3
      },
      'work-current': {
        // Keywords ranked by importance (most important first)
        keywords: [
          // Highest priority: urgent, deadlines, action items
          'deadline', 'deadlines', 'urgent', 'asap', 'action items', 'action item', 'action required', 'action needed',
          'follow up', 'follow-ups', 'follow-up', 'follow ups', 'todo', 'todos', 'to-do', 'to-dos',
          // High priority: meetings, projects, reviews
          'meeting', 'meetings', 'project', 'projects', 'review', 'reviews', 'code review', 'code reviews', 'pr review', 'pr reviews',
          'pull request', 'pull requests', 'merge', 'merges', 'deploy', 'deploys',
          // Medium priority: team syncs, planning
          'team', 'teams', 'sync', 'syncs', 'sync up', 'sync ups', '1:1', 'one-on-one', 'one on one',
          'sprint planning', 'sprint plannings', 'sprint', 'sprints', 'standup', 'standups', 'stand-up', 'stand-ups', 'stand up', 'stand ups',
          // Lower priority: tools, retrospectives
          'retrospective', 'retrospectives', 'retro', 'retros', 'all hands', 'all-hands',
          'slack', 'jira', 'confluence', 'trello', 'asana', 'notion'
        ],
        priority: 4
      },
      'work-opportunities': {
        // Keywords ranked by importance (most important first)
        keywords: [
          // Highest priority: interviews, applications, job openings
          'interview', 'interviews', 'apply now', 'application', 'applications', 'job opening', 'job openings', 'job opportunity', 'job opportunities',
          // High priority: recruiters, hiring, positions
          'recruiter', 'recruiters', 'hiring', 'we are hiring', 'we\'re hiring', 'hiring now', 'position', 'positions', 'job', 'jobs',
          // Medium priority: career, opportunity
          'opportunity', 'opportunities', 'career', 'careers', 'resume', 'resumes', 'cv', 'cvs', 'curriculum vitae',
          // Lower priority: job sites, general terms
          'recruiting', 'talent', 'talents', 'headhunter', 'headhunters', 'recruitment', 'recruitments', 'job search', 'job searches',
          'linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter', 'angel.co', 'angelist'
        ],
        priority: 3
      },
      'finance': {
        // Keywords ranked by importance (most important first)
        keywords: [
          // Highest priority: urgent financial matters
          'payment due', 'payments due', 'overdue', 'past due', 'amount due', 'amounts due', 'balance due', 'balances due', 'minimum payment', 'minimum payments',
          'alert', 'alerts', 'notification', 'notifications', 'reminder', 'reminders', 'payment reminder', 'payment reminders',
          // High priority: invoices, receipts, charges
          'invoice', 'invoices', 'receipt', 'receipts', 'charge', 'charges', 'charged', 'payment', 'payments', 'transaction', 'transactions',
          // Medium priority: statements, balances, accounts
          'statement', 'statements', 'balance', 'balances', 'account balance', 'account balances', 'available balance', 'available balances', 'account summary', 'account summaries',
          'account', 'accounts', 'purchase', 'purchases', '$', 'dollar', 'dollars',
          // Lower priority: subscriptions, bills, services
          'subscription', 'subscriptions', 'renewal', 'renewals', 'renew', 'billing', 'billed', 'monthly', 'annual', 'yearly',
          'subscription fee', 'subscription fees', 'membership', 'memberships', 'auto-renew', 'auto renew',
          'bill', 'bills', 'utility', 'utilities', 'electric', 'gas', 'water', 'phone bill', 'phone bills', 'internet bill', 'internet bills',
          'credit card', 'credit cards', 'creditcard', 'creditcards', 'card ending', 'card endings', 'card number', 'card numbers', 'expires',
          'bank', 'banks', 'banking', 'checking', 'savings', 'deposit', 'deposits', 'withdrawal', 'withdrawals', 'transfer', 'transfers',
          'paypal', 'stripe', 'venmo', 'zelle', 'cash app', 'square', 'chase', 'bank of america',
          'wells fargo', 'citi', 'american express', 'amex', 'discover', 'capital one'
        ],
        domains: ['bank', 'paypal', 'stripe', 'chase', 'wellsfargo', 'bofa', 'citi', 'amex', 
                  'discover', 'capitalone', 'venmo', 'square', 'billing', 'invoice', 'payment'],
        priority: 4
      },
      'personal': {
        // Keywords ranked by importance (most important first)
        keywords: [
          // Highest priority: special events
          'birthday', 'birthdays', 'wedding', 'weddings', 'anniversary', 'anniversaries', 'celebration', 'celebrations',
          'congratulations', 'congrats', 'baby', 'babies', 'shower', 'showers',
          // Medium priority: social gatherings
          'party', 'parties', 'dinner', 'dinners', 'lunch', 'lunches', 'brunch', 'brunches', 'coffee', 'drinks', 'happy hour', 'happy hours',
          'weekend plans', 'get together', 'get togethers',
          // Lower priority: general social
          'family', 'families', 'friend', 'friends', 'weekend', 'weekends', 'holiday', 'holidays', 'vacation', 'vacations', 'trip', 'trips', 'travel',
          'catch up', 'catch ups', 'hang out', 'hang outs', 'hangout', 'hangouts'
        ],
        priority: 2
      },
      'auth-codes': {
        keywords: ['verification code', 'security code', 'login code', 'one-time', 'otp', '2fa'],
        priority: 1,
        autoDelete: 1
      },
      'promo': {
        keywords: [
          'sale', 'sales', 'discount', 'discounts', 'offer', 'offers', 'deal', 'deals', 'promo', 'promos', 'coupon', 'coupons', 'subscribe', 'unsubscribe',
          'limited time', 'limited-time', 'act now', 'buy now', 'shop now', 'order now',
          'free shipping', 'free trial', 'free trials', 'special offer', 'special offers', 'exclusive offer', 'exclusive offers', 'flash sale', 'flash sales',
          'clearance', 'clearances', 'savings', 'save up to', 'percent off', '% off', 'off',
          'newsletter', 'newsletters', 'marketing', 'promotional', 'advertisement', 'advertisements', 'ad', 'ads',
          'noreply', 'no-reply', 'donotreply', 'do not reply', 'mailing list', 'mailing lists'
        ],
        priority: 1,
        autoDelete: 1
      }
    };

    this.urgentKeywords = [
      'urgent', 'asap', 'as soon as possible', 'immediately', 'immediate', 'right away',
      'deadline', 'due today', 'due now', 'action required', 'action needed',
      'time sensitive', 'time-sensitive', 'expires today', 'expiring today',
      'critical', 'emergency', 'emergencies', 'asap', 'rush', 'hurry'
    ];
    this.importantKeywords = [
      'important', 'priority', 'attention', 'required', 'must', 'need', 'needed',
      'please respond', 'please reply', 'response needed', 'reply needed',
      'confirmation required', 'verification needed', 'approval needed'
    ];
  }

  classifyEmail(email) {
    const from = email.from?.toLowerCase() || '';
    const subject = email.subject?.toLowerCase() || '';
    const emailDomain = from.split('@')[1]?.toLowerCase() || '';
    const senderName = from.split('@')[0]?.toLowerCase() || '';
    
    // Progressive classification: start with subject + sender only
    let bestCategory = 'other';
    let bestScore = 0;
    let priority = 1;
    let isNewsletter = false;
    const CONFIDENCE_THRESHOLD = 8; // Stop if we get this score or higher

    // Quick checks using only subject + sender (no body needed)
    // Check for non-human emails FIRST (no-reply, bots, automated)
    if (this.isNonHumanEmailQuick(from, subject)) {
      return {
        category: 'other',
        priority: 1,
        isNewsletter: false,
        confidence: 20,
        isNonHuman: true
      };
    }

    // Check for privacy policy emails (low priority) - check subject first
    const privacyKeywords = ['privacy policy', 'privacy notice', 'privacy update', 'privacy changes', 
                             'terms of service', 'terms and conditions'];
    const hasPrivacyKeyword = privacyKeywords.some(kw => subject.includes(kw.toLowerCase()));
    
    if (hasPrivacyKeyword || from.includes('privacy')) {
      return {
        category: 'other',
        priority: 1,
        isNewsletter: false,
        confidence: 15,
        isNonHuman: true
      };
    }

    // Check for auth codes (subject only)
    if (/\b\d{4,8}\b/.test(subject) && (subject.includes('code') || subject.includes('verify'))) {
      return {
        category: 'auth-codes',
        priority: 1,
        isNewsletter: false,
        confidence: 15
      };
    }

    // Check for newsletter patterns (subject + sender only)
    isNewsletter = this.isNewsletterQuick(from, subject);
    if (isNewsletter && !subject.includes('invoice') && !subject.includes('payment') && !subject.includes('receipt')) {
      return {
        category: 'promo',
        priority: 1,
        isNewsletter: true,
        confidence: 10
      };
    }

    // EARLY CHECK: Detect news sources before classification (to prevent misclassification)
    // Get body early for news detection (but only first few lines for performance)
    const body = email.body?.toLowerCase() || '';
    const bodyPreview = body.split('\n').slice(0, 3).join(' ').toLowerCase();
    const isNews = this.isNewsSource(from, emailDomain, subject, bodyPreview);
    
    if (isNews) {
      // Use full body for unsubscribe and breaking news checks
      const fullText = `${subject} ${body}`.toLowerCase();
      const hasUnsubscribe = fullText.includes('unsubscribe') || fullText.includes('unsub');
      
      // Check for breaking news keywords
      const breakingNewsKeywords = ['breaking news', 'breaking', 'urgent news', 'alert', 'breaking story', 'just in'];
      const isBreakingNews = breakingNewsKeywords.some(kw => fullText.includes(kw));
      
      return {
        category: 'promo',
        priority: isBreakingNews ? 2 : 1, // Breaking news = 2, regular news = 1
        isNewsletter: true,
        confidence: 20,
        isNonHuman: false
      };
    }

    // Try classification with subject + sender only (FAST PATH)
    const quickResult = this.classifyWithText(from, subject, '', emailDomain, senderName);
    if (quickResult.score >= CONFIDENCE_THRESHOLD) {
      bestCategory = quickResult.category;
      bestScore = quickResult.score;
      priority = quickResult.priority;
      // Use keyword rank from quick result if available
      if (quickResult.keywordRank !== undefined) {
        const totalKeywords = this.categories[bestCategory]?.keywords?.length || 100;
        const rankPercent = quickResult.keywordRank / totalKeywords;
        if (rankPercent < 0.2) {
          priority = 4;
        } else if (rankPercent < 0.5) {
          priority = 3;
        } else if (rankPercent < 0.8) {
          priority = 2;
        }
      }
    } else {
      // Not confident enough, need to check body progressively
      const body = email.body?.toLowerCase() || '';
      const bodyLines = body.split('\n').filter(line => line.trim().length > 0);
      
      // Try with first line of body
      if (bodyLines.length > 0) {
        const firstLineResult = this.classifyWithText(from, subject, bodyLines[0], emailDomain, senderName);
        if (firstLineResult.score > bestScore || 
            (firstLineResult.score === bestScore && firstLineResult.keywordRank < (quickResult.keywordRank || Infinity))) {
          bestCategory = firstLineResult.category;
          bestScore = firstLineResult.score;
          priority = firstLineResult.priority;
          // Apply rank-based priority adjustment
          if (firstLineResult.keywordRank !== undefined) {
            const totalKeywords = this.categories[bestCategory]?.keywords?.length || 100;
            const rankPercent = firstLineResult.keywordRank / totalKeywords;
            if (rankPercent < 0.2) {
              priority = 4;
            } else if (rankPercent < 0.5) {
              priority = 3;
            } else if (rankPercent < 0.8) {
              priority = 2;
            }
          }
        }
      }
      
      // If still not confident, try with first 2 lines
      if (bestScore < CONFIDENCE_THRESHOLD && bodyLines.length > 1) {
        const twoLines = bodyLines.slice(0, 2).join(' ');
        const twoLinesResult = this.classifyWithText(from, subject, twoLines, emailDomain, senderName);
        if (twoLinesResult.score > bestScore) {
          bestCategory = twoLinesResult.category;
          bestScore = twoLinesResult.score;
          priority = twoLinesResult.priority;
          if (twoLinesResult.keywordRank !== undefined) {
            const totalKeywords = this.categories[bestCategory]?.keywords?.length || 100;
            const rankPercent = twoLinesResult.keywordRank / totalKeywords;
            if (rankPercent < 0.2) {
              priority = 4;
            } else if (rankPercent < 0.5) {
              priority = 3;
            } else if (rankPercent < 0.8) {
              priority = 2;
            }
          }
        }
      }
      
      // If still not confident, try with first 3 lines
      if (bestScore < CONFIDENCE_THRESHOLD && bodyLines.length > 2) {
        const threeLines = bodyLines.slice(0, 3).join(' ');
        const threeLinesResult = this.classifyWithText(from, subject, threeLines, emailDomain, senderName);
        if (threeLinesResult.score > bestScore) {
          bestCategory = threeLinesResult.category;
          bestScore = threeLinesResult.score;
          priority = threeLinesResult.priority;
          if (threeLinesResult.keywordRank !== undefined) {
            const totalKeywords = this.categories[bestCategory]?.keywords?.length || 100;
            const rankPercent = threeLinesResult.keywordRank / totalKeywords;
            if (rankPercent < 0.2) {
              priority = 4;
            } else if (rankPercent < 0.5) {
              priority = 3;
            } else if (rankPercent < 0.8) {
              priority = 2;
            }
          }
        }
      }
      
      // Last resort: use full body (but we try to avoid this)
      if (bestScore < 3 && body.length > 0) {
        // Check for privacy policy in body before classifying
        const privacyKeywords = ['privacy policy', 'privacy notice', 'privacy update', 'privacy changes', 
                                 'terms of service', 'terms and conditions'];
        const hasPrivacyKeyword = privacyKeywords.some(kw => body.includes(kw.toLowerCase()));
        
        if (hasPrivacyKeyword) {
          return {
            category: 'other',
            priority: 1,
            isNewsletter: false,
            confidence: 15,
            isNonHuman: true
          };
        }
        
        const fullBodyResult = this.classifyWithText(from, subject, body, emailDomain, senderName);
        if (fullBodyResult.score > bestScore) {
          bestCategory = fullBodyResult.category;
          bestScore = fullBodyResult.score;
          priority = fullBodyResult.priority;
          if (fullBodyResult.keywordRank !== undefined) {
            const totalKeywords = this.categories[bestCategory]?.keywords?.length || 100;
            const rankPercent = fullBodyResult.keywordRank / totalKeywords;
            if (rankPercent < 0.2) {
              priority = 4;
            } else if (rankPercent < 0.5) {
              priority = 3;
            } else if (rankPercent < 0.8) {
              priority = 2;
            }
          }
        }
      }
    }

    // Get full text for comprehensive checks (body already declared above)
    const fullText = `${subject} ${body}`.toLowerCase();
    const formulaResult = this.calculateImportanceScore({
      from,
      subject,
      body,
      emailDomain,
      senderName,
      category: bestCategory
    });
    const formulaPriority = this.mapImportanceScoreToPriority(formulaResult.score);
    
    // RULE 1: Check for "unsubscribe" anywhere in email
    const hasUnsubscribe = fullText.includes('unsubscribe') || fullText.includes('unsub');
    
    // RULE 3: Check for high-priority keywords (quiz, test, emergency, missed, important)
    const highPriorityKeywords = {
      'emergency': 5,  // Emergency = priority 5
      'quiz': 4,       // Quiz = priority 4
      'quizzes': 4,
      'test': 4,       // Test = priority 4
      'tests': 4,
      'missed': 4,     // Missed = priority 4
      'important': 4   // Important = priority 4
    };
    
    let highPriorityBoost = 0;
    let matchedHighPriorityKeyword = null;
    
    for (const [keyword, boostValue] of Object.entries(highPriorityKeywords)) {
      if (fullText.includes(keyword)) {
        highPriorityBoost = Math.max(highPriorityBoost, boostValue);
        matchedHighPriorityKeyword = keyword;
        break; // Use the highest priority match
      }
    }
    
    // RULE 1 & 4: Handle unsubscribe emails
    if (hasUnsubscribe) {
      // RULE 4: If unsubscribe + high-priority keyword, demote to priority 2
      if (matchedHighPriorityKeyword) {
        return {
          category: bestCategory === 'other' ? 'promo' : bestCategory,
          priority: 2,
          isNewsletter: true,
          confidence: bestScore || 15,
          isNonHuman: false
        };
      }
      
      // Check if this is a news/newsletter source
      const isNewsSource = this.isNewsSource(from, emailDomain, subject, body);
      if (isNewsSource) {
        // Check for breaking news keywords
        const breakingNewsKeywords = ['breaking news', 'breaking', 'urgent news', 'alert', 'breaking story', 'just in'];
        const isBreakingNews = breakingNewsKeywords.some(kw => fullText.includes(kw));
        
        return {
          category: 'promo',
          priority: isBreakingNews ? 2 : 1, // Breaking news = 2, regular news = 1
          isNewsletter: true,
          confidence: 20,
          isNonHuman: false
        };
      }
      
      // Regular unsubscribe email = priority 1
      return {
        category: bestCategory === 'other' ? 'promo' : bestCategory,
        priority: 1,
        isNewsletter: true,
        confidence: bestScore || 15,
        isNonHuman: false
      };
    }
    
    // RULE 2: Apply high-priority keyword boost (only if no unsubscribe)
    // Note: News sources are already checked early and return early, so we don't need to check again here
    if (matchedHighPriorityKeyword) {
      priority = highPriorityBoost;
    }
    
    // Check if email is personalized (not a mass email/newsletter)
    const isPersonalized = !hasUnsubscribe && 
                          !email.isNonHuman && 
                          !isNewsletter && 
                          bestCategory !== 'other' &&
                          bestCategory !== 'promo' &&
                          bestCategory !== 'auth-codes';
    
    // Apply formula-based priority as a baseline
    if (!matchedHighPriorityKeyword) {
      priority = Math.max(priority, formulaPriority);
    }

    // Adjust priority based on urgency (subject only for speed)
    const subjectUrgent = this.urgentKeywords.some(kw => subject.includes(kw.toLowerCase()));
    const subjectImportant = this.importantKeywords.some(kw => subject.includes(kw.toLowerCase()));
    
    // Automated/non-human emails should always be priority 1 (low urgency for replies)
    if (email.isNonHuman || bestCategory === 'other') {
      priority = 1;
    } else if (!matchedHighPriorityKeyword) {
      // Only apply these rules if we haven't already set priority via high-priority keywords
      // Personalized emails without unsubscribe get priority 4 minimum
      if (isPersonalized && priority < 4) {
        priority = 4;
      }
      
      // Urgent keywords can boost to 5, but maintain distribution for others
      if (subjectUrgent) {
        priority = 5; // Urgent always gets highest priority
      } else if (subjectImportant) {
        // Important keywords boost by 1, but cap at 4 to maintain distribution
        priority = Math.min(4, priority + 1);
      }
      
      // Minor boosts for unread and money amounts (but keep in 2-4 range)
      if (email.unread && priority < 4) {
        priority = Math.min(4, priority + 0.3);
      }
      if (bestCategory === 'finance' && /\$[\d,]+\.?\d*/.test(subject) && priority < 4) {
        priority = Math.min(4, priority + 0.3);
      }
      
      // Ensure priority stays in 2-4 range for normal emails (unless urgent or personalized)
      if (!subjectUrgent && !isPersonalized && priority < 2) {
        priority = 2; // Minimum 2 for categorized emails
      }
    }

    priority = this.adjustPriorityByHistory(email, priority);

    // Ensure non-human emails are always priority 1
    const finalPriority = (email.isNonHuman || bestCategory === 'other') 
      ? 1 
      : Math.max(1, Math.min(5, Math.round(priority)));
    
    return {
      category: bestCategory,
      priority: finalPriority,
      isNewsletter,
      confidence: bestScore,
      isNonHuman: email.isNonHuman || false
    };
  }

  // Fast classification using only provided text (subject + optional body lines)
  classifyWithText(from, subject, bodyText, emailDomain, senderName) {
    let bestCategory = 'other';
    let bestScore = 0;
    let bestKeywordRank = Infinity; // Lower rank = more important
    let priority = 1;
    const text = `${from} ${subject} ${bodyText}`;

    for (const [category, config] of Object.entries(this.categories)) {
      if (category === 'auth-codes' || category === 'promo') continue;
      
      let score = 0;
      let bestMatchedRank = Infinity; // Track the best (lowest) rank of matched keywords

      // Check domains first (strongest signal, no body needed)
      if (config.domains && config.domains.length > 0) {
        const domainMatch = config.domains.some(d => {
          const lowerD = d.toLowerCase();
          return emailDomain.includes(lowerD) || emailDomain.endsWith('.' + lowerD) || emailDomain === lowerD;
        });
        if (domainMatch) {
          score += 10; // Domain match is very strong
          bestMatchedRank = 0; // Domain match is highest priority
        }
      }

      // Check keywords with rank-based scoring (earlier in list = more important)
      if (config.keywords && Array.isArray(config.keywords) && config.keywords.length > 0) {
        config.keywords.forEach((kw, index) => {
          if (!kw || typeof kw !== 'string') return;
          const lowerKw = kw.toLowerCase();
          let matched = false;
          let rankWeight = 0;

          // Subject matches (highest weight, and check rank)
          if (subject.includes(lowerKw)) {
            matched = true;
            // Earlier keywords (lower index) get higher weight
            // First 20% of keywords = 5x, next 30% = 3x, rest = 2x
            const keywordPercent = index / config.keywords.length;
            if (keywordPercent < 0.2) {
              rankWeight = 5;
            } else if (keywordPercent < 0.5) {
              rankWeight = 3;
            } else {
              rankWeight = 2;
            }
            score += rankWeight;
            if (index < bestMatchedRank) {
              bestMatchedRank = index;
            }
          }

          // Sender name matches (medium weight)
          if (senderName.includes(lowerKw)) {
            matched = true;
            const keywordPercent = index / config.keywords.length;
            const rankWeight = keywordPercent < 0.3 ? 2 : 1;
            score += rankWeight;
            if (index < bestMatchedRank) {
              bestMatchedRank = index;
            }
          }

          // Body matches (lower weight, only if provided)
          if (bodyText && bodyText.includes(lowerKw)) {
            matched = true;
            const keywordPercent = index / config.keywords.length;
            const rankWeight = keywordPercent < 0.3 ? 2 : 1;
            score += rankWeight;
            if (index < bestMatchedRank) {
              bestMatchedRank = index;
            }
          }
        });
      }

      if (score > bestScore || (score === bestScore && bestMatchedRank < bestKeywordRank)) {
        bestScore = score;
        bestCategory = category;
        bestKeywordRank = bestMatchedRank;
        priority = config.priority || 1;
      }
    }

    // Adjust priority based on keyword rank for better distribution across 2-4
    // Lower rank (earlier in list) = higher priority boost
    if (bestKeywordRank < Infinity && bestCategory !== 'other') {
      const totalKeywords = this.categories[bestCategory]?.keywords?.length || 100;
      const rankPercent = bestKeywordRank / totalKeywords;
      
      // Create more even distribution:
      // Top 20% keywords -> priority 4
      // Next 30% keywords -> priority 3
      // Next 30% keywords -> priority 2
      // Bottom 20% keywords -> priority 2 (or keep base)
      if (rankPercent < 0.2) {
        priority = 4;
      } else if (rankPercent < 0.5) {
        priority = 3;
      } else if (rankPercent < 0.8) {
        priority = 2;
      } else {
        priority = Math.max(2, priority); // Keep at least 2 for categorized emails
      }
    }

    return { category: bestCategory, score: bestScore, priority, keywordRank: bestKeywordRank };
  }

  // Quick non-human check using only sender and subject
  isNonHumanEmailQuick(from, subject) {
    const nonHumanPatterns = [
      'noreply', 'no-reply', 'donotreply', 'do not reply', 'do-not-reply',
      'no_reply', 'noreply@', 'no-reply@', 'donotreply@',
      'bot@', 'automation@', 'system@', 'mailer@', 'mailer-daemon',
      'postmaster@', 'mail delivery', 'automated', 'automatic'
    ];
    return nonHumanPatterns.some(pattern => from.includes(pattern) || subject.includes(pattern));
  }

  // Quick newsletter check using only sender and subject
  isNewsletterQuick(from, subject) {
    const newsletterIndicators = [
      'unsubscribe', 'newsletter', 'noreply', 'no-reply', 'donotreply',
      'mailing list', 'mailchimp', 'constant contact'
    ];
    return newsletterIndicators.some(indicator => from.includes(indicator) || subject.includes(indicator));
  }

  isNonHumanEmail(email) {
    // Use quick check first (subject + sender only)
    const from = email.from?.toLowerCase() || '';
    const subject = email.subject?.toLowerCase() || '';
    
    if (this.isNonHumanEmailQuick(from, subject)) {
      return true;
    }
    
    // If quick check doesn't catch it, check body (but only first line for efficiency)
    const body = email.body?.toLowerCase() || '';
    const firstLine = body.split('\n')[0] || '';
    
    const nonHumanPatterns = [
      'this is an automated', 'this email was sent automatically',
      'please do not reply', 'do not reply to this email',
      'delivery failure', 'delivery status', 'undeliverable', 'bounce',
      'out of office', 'out-of-office', 'automatic reply', 'auto-reply'
    ];
    
    if (nonHumanPatterns.some(pattern => firstLine.includes(pattern))) {
      return true;
    }
    
    // Check for automated domains
    const emailDomain = from.split('@')[1]?.toLowerCase() || '';
    const automatedDomains = [
      'mailchimp.com', 'constantcontact.com', 'sendgrid.net', 'mandrillapp.com',
      'amazonaws.com', 'salesforce.com', 'hubspot.com', 'marketo.com'
    ];
    
    return automatedDomains.some(domain => emailDomain.includes(domain));
  }

  isNewsletter(email) {
    // Use quick check (subject + sender only)
    const from = email.from?.toLowerCase() || '';
    const subject = email.subject?.toLowerCase() || '';
    return this.isNewsletterQuick(from, subject);
  }

  // Check if email is from a news source (newspaper, news website, etc.)
  isNewsSource(from, emailDomain, subject, body) {
    // FIRST: Check for NYT - any email containing "@nytimes" is from NYT
    // This catches all 80+ NYT email variations
    if (from.includes('@nytimes')) {
      return true;
    }
    
    const newsDomains = [
      'wsj.com', 'washingtonpost.com', 'usatoday.com',
      'cnn.com', 'bbc.com', 'reuters.com', 'ap.org', 'bloomberg.com',
      'theguardian.com', 'npr.org', 'abc.com', 'cbs.com', 'nbc.com',
      'foxnews.com', 'msnbc.com', 'cnbc.com', 'forbes.com', 'time.com',
      'news', 'newspaper', 'newsletter', 'breaking', 'alert'
    ];
    
    // Specific news sender addresses (including breaking news addresses)
    const newsSenders = [
      // Wall Street Journal
      'newsletters@wsj.com', 'wsj.com',
      // CNN
      'breakingnews@mail.cnn.com', 'breakingnews@cnn.com', 'cnn.com',
      // BBC
      'news@bbc.co.uk', 'bbc.co.uk', 'bbc.com',
      // Reuters
      'newsletters@reuters.com', 'reuters.com',
      // Washington Post
      'newsletters@washpost.com', 'washingtonpost.com', 'washpost.com',
      // Fox News
      'foxnews@e.foxnews.com', 'foxnews.com',
      // NBC News
      'breakingnews@news.nbcnews.com', 'nbcnews.com', 'nbc.com',
      // CBS News
      'news@cbsnews.com', 'cbsnews.com', 'cbs.com',
      // ABC News
      'abcnews@abc.go.com', 'abcnews.com', 'abc.com',
      // Associated Press
      'apnews@ap.org', 'ap.org',
      // Bloomberg
      'newsletters@bloomberg.com', 'bloomberg.com',
      // NPR
      'news@npr.org', 'npr.org',
      // The Guardian
      'news@theguardian.com', 'theguardian.com',
      // USA Today
      'news@usatoday.com', 'usatoday.com',
      // Other major outlets
      'newsletters@latimes.com', 'latimes.com',
      'newsletters@politico.com', 'politico.com',
      'newsletters@axios.com', 'axios.com',
      'newsletters@theatlantic.com', 'theatlantic.com'
    ];
    
    const newsKeywords = [
      'newsletter', 'daily news', 'breaking news', 'news update',
      'morning briefing', 'evening briefing', 'news digest', 'news roundup',
      'the new york times', 'new york times', 'ny times'
    ];
    
    const fullText = `${from} ${subject} ${body || ''}`.toLowerCase();
    
    // Check for specific news sender addresses (most reliable)
    if (newsSenders.some(sender => from.includes(sender.toLowerCase()))) {
      return true;
    }
    
    // Check domain (more comprehensive check)
    if (newsDomains.some(domain => {
      const lowerDomain = domain.toLowerCase();
      return emailDomain.includes(lowerDomain) || 
             emailDomain.endsWith('.' + lowerDomain) ||
             emailDomain === lowerDomain ||
             from.includes(lowerDomain);
    })) {
      return true;
    }
    
    // Check keywords in subject, body, or sender
    if (newsKeywords.some(kw => fullText.includes(kw.toLowerCase()))) {
      return true;
    }
    
    // Check sender name for news-related terms
    if (from.includes('news') || from.includes('newsletter') || from.includes('breaking') ||
        from.includes('nytimes') || from.includes('ny times') || from.includes('new york times') ||
        from.includes('nytdirect')) {
      return true;
    }
    
    // Check subject for news source indicators
    if (subject.includes('the new york times') || subject.includes('ny times') || 
        subject.includes('nytimes') || subject.includes('newsletter')) {
      return true;
    }
    
    return false;
  }

  calculateImportanceScore({ from, subject, body, emailDomain, senderName, category }) {
    const fullText = `${from} ${subject} ${body}`.toLowerCase();

    const actionRequired = this.getActionRequiredScore(fullText);
    const deadlineProximity = this.getDeadlineProximityScore(fullText);
    const consequenceSeverity = this.getConsequenceSeverityScore(fullText, category);
    const senderAuthority = this.getSenderAuthorityScore(fullText, emailDomain, senderName);
    const blockingStatus = this.getBlockingStatusScore(fullText);

    const score = (actionRequired * 2) +
      (deadlineProximity * 2) +
      (consequenceSeverity * 3) +
      (senderAuthority * 1) +
      (blockingStatus * 2);

    return {
      score,
      signals: {
        actionRequired,
        deadlineProximity,
        consequenceSeverity,
        senderAuthority,
        blockingStatus
      }
    };
  }

  mapImportanceScoreToPriority(score) {
    if (score >= 12) return 5;
    if (score >= 9) return 4;
    if (score >= 6) return 3;
    if (score >= 3) return 2;
    return 1;
  }

  getActionRequiredScore(text) {
    const actionKeywords = [
      'action required', 'action needed', 'please respond', 'please reply',
      'response needed', 'reply needed', 'approval needed', 'approve',
      'confirm', 'confirmation', 'rsvp', 'submit', 'submission', 'fill out',
      'sign', 'signature', 'payment', 'pay', 'invoice', 'schedule', 'book',
      'meeting request', 'calendar invite'
    ];
    if (actionKeywords.some(kw => text.includes(kw))) {
      return 1;
    }
    return text.includes('?') ? 1 : 0;
  }

  getDeadlineProximityScore(text) {
    const urgentKeywords = [
      'today', 'tonight', 'asap', 'urgent', 'immediately', 'eod', 'end of day',
      'deadline', 'due today', 'due now', 'expires today'
    ];
    const soonKeywords = [
      'tomorrow', 'this week', 'by monday', 'by tuesday', 'by wednesday',
      'by thursday', 'by friday', 'by saturday', 'by sunday', 'next week',
      'due this week'
    ];
    if (urgentKeywords.some(kw => text.includes(kw))) {
      return 2;
    }
    if (soonKeywords.some(kw => text.includes(kw))) {
      return 1;
    }
    return 0;
  }

  getConsequenceSeverityScore(text, category) {
    const highSeverityKeywords = [
      'overdue', 'past due', 'payment due', 'account locked', 'suspended',
      'fraud', 'security alert', 'breach', 'incident', 'outage',
      'legal', 'court', 'chargeback'
    ];
    const mediumSeverityKeywords = [
      'assignment', 'exam', 'final', 'midterm', 'grade', 'gpa',
      'invoice', 'payment', 'billing', 'contract', 'production',
      'downtime', 'error', 'failure'
    ];

    if (highSeverityKeywords.some(kw => text.includes(kw))) {
      return 3;
    }
    if (category === 'finance' || category === 'work-current' || category === 'school') {
      return 2;
    }
    if (mediumSeverityKeywords.some(kw => text.includes(kw))) {
      return 2;
    }
    return 0;
  }

  getSenderAuthorityScore(text, emailDomain, senderName) {
    const highAuthorityKeywords = [
      'ceo', 'cto', 'cfo', 'vp', 'vice president', 'director', 'head of',
      'manager', 'lead', 'principal', 'professor', 'dean', 'president'
    ];
    const mediumAuthorityKeywords = [
      'hr', 'admin', 'support', 'team', 'boss', 'supervisor'
    ];

    if (emailDomain && (emailDomain.endsWith('.edu') || emailDomain.includes('school'))) {
      return 2;
    }
    if (this.categories?.finance?.domains?.some(d => emailDomain?.includes(d))) {
      return 2;
    }
    if (highAuthorityKeywords.some(kw => text.includes(kw) || senderName.includes(kw))) {
      return 2;
    }
    if (mediumAuthorityKeywords.some(kw => text.includes(kw) || senderName.includes(kw))) {
      return 1;
    }
    return 0;
  }

  getBlockingStatusScore(text) {
    const blockingKeywords = [
      'blocked', 'blocking', 'waiting on you', 'pending your',
      'need your approval', 'stuck until', 'cannot proceed', 'can\'t proceed'
    ];
    return blockingKeywords.some(kw => text.includes(kw)) ? 1 : 0;
  }

  adjustPriorityByHistory(email, currentPriority) {
    // In a real implementation, this would check historical reply rates
    // For now, we'll keep the priority as is
    return currentPriority;
  }

  getPriorityColor(priority) {
    // More vibrant, saturated colors for better visibility
    const colors = {
      5: '#FF3333', // Bright red - urgent (more saturated)
      4: '#FF6600', // Bright orange - high (more saturated)
      3: '#FFCC00', // Bright yellow - medium-high (more saturated)
      2: '#66CC66', // Medium green - medium (more saturated)
      1: '#339933'  // Medium dark green - low (more saturated)
    };
    return colors[priority] || colors[1];
  }

  extractImportantInfo(email) {
    const info = {
      links: [],
      dates: [],
      money: [],
      tasks: []
    };

    const text = `${email.subject} ${email.body}`;

    // Extract links
    const linkRegex = /https?:\/\/[^\s]+/g;
    info.links = text.match(linkRegex) || [];

    // Extract dates
    const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\w+\s+\d{1,2},?\s+\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g;
    info.dates = text.match(dateRegex) || [];

    // Extract money amounts
    const moneyRegex = /\$[\d,]+\.?\d*/g;
    info.money = text.match(moneyRegex) || [];

    // Extract tasks (lines starting with -, *, or numbered)
    const taskRegex = /^[\s]*[-*•]\s+.+$/gm;
    info.tasks = (text.match(taskRegex) || []).slice(0, 5);

    return info;
  }

  checkDNDRules(email, dndRules) {
    if (!dndRules || dndRules.length === 0) return false;

    const from = email.from?.toLowerCase() || '';
    const subject = email.subject?.toLowerCase() || '';
    const text = `${from} ${subject}`;
    const now = new Date();
    const hour = now.getHours();

    for (const rule of dndRules) {
      if (!rule.enabled) continue;

      // Check time-based rules
      if (rule.timeStart && rule.timeEnd) {
        const start = parseInt(rule.timeStart);
        const end = parseInt(rule.timeEnd);
        if (hour >= start && hour < end) {
          // Check exceptions
          if (this.checkExceptions(email, rule.exceptions || [])) {
            continue; // Exception matched, don't apply DND
          }
          return true; // DND active
        }
      }

      // Check sender-based rules
      if (rule.senders && rule.senders.length > 0) {
        if (rule.senders.some(sender => from.includes(sender.toLowerCase()))) {
          if (this.checkExceptions(email, rule.exceptions || [])) {
            continue;
          }
          return true;
        }
      }
    }

    return false;
  }

  checkExceptions(email, exceptions) {
    if (!exceptions || exceptions.length === 0) return false;

    const subject = email.subject?.toLowerCase() || '';
    const body = email.body?.toLowerCase() || '';
    const text = `${subject} ${body}`;

    for (const exception of exceptions) {
      if (exception.type === 'keyword' && exception.value) {
        if (text.includes(exception.value.toLowerCase())) {
          return true;
        }
      } else if (exception.type === 'urgent' && exception.enabled) {
        if (this.urgentKeywords.some(kw => text.includes(kw))) {
          return true;
        }
      } else if (exception.type === 'deadline' && exception.enabled) {
        const deadlineRegex = /\bdeadline\b.*?\b(\d{1,2}[\/\-]\d{1,2})/i;
        if (deadlineRegex.test(text)) {
          return true;
        }
      }
    }

    return false;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailClassifier;
}


