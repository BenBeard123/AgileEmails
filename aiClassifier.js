/**
 * Local AI classifier for AgileEmails (Transformers.js zero-shot).
 * Bundle with: npm run build (or npm run build:ai)
 * Sets window.agileEmailsAIClassifier = { init, classify } for content script.
 */

const CATEGORY_LABELS = [
  'school',
  'work',
  'job recruitment',
  'finance',
  'personal',
  'promotion or newsletter',
  'other'
];

const LABEL_TO_CATEGORY = {
  'school': 'school',
  'work': 'work-current',
  'job recruitment': 'work-opportunities',
  'finance': 'finance',
  'personal': 'personal',
  'promotion or newsletter': 'promo',
  'other': 'other'
};

const CATEGORY_PRIORITY = {
  'school': 3,
  'work-current': 4,
  'work-opportunities': 3,
  'finance': 4,
  'personal': 2,
  'promo': 1,
  'other': 1
};

const CLASSIFY_TIMEOUT_MS = 5000;
let zeroShotPipeline = null;

async function init() {
  if (zeroShotPipeline) return;
  try {
    const mod = await import('@huggingface/transformers');
    const { pipeline, env } = mod;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      env.backends = env.backends || {};
      env.backends.onnx = env.backends.onnx || {};
      env.backends.onnx.wasm = env.backends.onnx.wasm || {};
      env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('lib/');
    }
    zeroShotPipeline = await pipeline(
      'zero-shot-classification',
      'Xenova/distilbert-base-uncased-mnli'
    );
  } catch (err) {
    console.warn('AgileEmails: AI classifier init failed', err);
    zeroShotPipeline = null;
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    )
  ]);
}

async function classify(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim().slice(0, 512);
  if (!trimmed) return null;
  if (!zeroShotPipeline) {
    try {
      await init();
    } catch (e) {
      return null;
    }
  }
  if (!zeroShotPipeline) return null;
  try {
    const result = await withTimeout(
      zeroShotPipeline(trimmed, CATEGORY_LABELS),
      CLASSIFY_TIMEOUT_MS
    );
    if (!result || !result.labels || !result.labels.length) return null;
    const topLabel = result.labels[0];
    const score = result.scores && result.scores[0] != null ? result.scores[0] : 0;
    const category = LABEL_TO_CATEGORY[topLabel] || 'other';
    const priority = CATEGORY_PRIORITY[category] ?? 3;
    return { category, priority, score };
  } catch (err) {
    console.warn('AgileEmails: AI classify failed', err);
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.agileEmailsAIClassifier = { init, classify };
}
