// This script defines the Shopify mock Product Analysis Service, which provides functions to analyze products based on their descriptions and metadata
// tracks usage against plan limits.

import Product from '../models/Product.js';
import ProductAnalysis from '../models/ProductAnalysis.js';
import Store from '../models/Store.js';
import { getAnalysisLimit } from '../config/planLimits.js';

const MAX_ISSUES = 5;

const ISSUE_LABELS = {
  'material details': 'Missing material details',
  'size or dimension info': 'Missing size or dimension info',
  'care instructions': 'Missing care instructions',
  'product images': 'Missing product images',
  'detailed description': 'Description too short',
};

const ISSUE_FIXES = {
  'material details': 'Add material composition (e.g. sterling silver, 18k gold).',
  'size or dimension info': 'Add sizing or dimensions so buyers know the fit.',
  'care instructions': 'Add care and storage instructions.',
  'product images': 'Add at least one high-quality product image.',
  'detailed description': 'Expand the description with key benefits and use cases.',
};

function stripHtml(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectMissingSignals(plainDescription, product) {
  const missing = [];
  const lower = plainDescription.toLowerCase();

  if (!/material|made (of|from)|fabric|metal|gold|silver/.test(lower)) {
    missing.push('material details');
  }
  if (!/size|dimension|length|width|fits|weight/.test(lower)) {
    missing.push('size or dimension info');
  }
  if (!/care|clean|maintain|store (it|in)/.test(lower)) {
    missing.push('care instructions');
  }
  if (!product.images || product.images.length === 0) {
    missing.push('product images');
  }
  if (plainDescription.length < 150) {
    missing.push('detailed description');
  }

  return missing;
}

function calculateScore(plainDescription, product, missingSignals) {
  let score = 40;
  if (plainDescription.length >= 200) score += 20;
  else if (plainDescription.length >= 100) score += 10;

  if (product.tags?.length >= 3) score += 10;
  if (product.images?.length >= 1) score += 10;
  if (/\n|•|-/.test(plainDescription)) score += 5;

  score -= missingSignals.length * 5;

  return Math.max(0, Math.min(100, score));
}

function toMajorIssues(missingSignals) {
  return missingSignals
    .slice(0, MAX_ISSUES)
    .map((signal) => ISSUE_LABELS[signal] || signal);
}

function toSuggestedFixes(missingSignals) {
  return missingSignals
    .slice(0, MAX_ISSUES)
    .map((signal) => ISSUE_FIXES[signal])
    .filter(Boolean);
}

function runSimulatedAnalysis(product) {
  const plainDescription = stripHtml(product.description || product.descriptionHtml || '');
  const missingSignals = detectMissingSignals(plainDescription, product);
  const score = calculateScore(plainDescription, product, missingSignals);

  return {
    score,
    majorIssues: toMajorIssues(missingSignals),
    suggestedFixes: toSuggestedFixes(missingSignals),
  };
}

async function buildUsageStats(storeId, store, limit) {
  const totalSynced = await Product.countDocuments({ storeId });
  const productsAnalyzed = await ProductAnalysis.countDocuments({ storeId });
  const productsLeftToAnalyze = Math.max(0, totalSynced - productsAnalyzed);
  const remainingInPlan =
    limit === Infinity ? null : Math.max(0, limit - productsAnalyzed);

  return {
    plan: store.plan,
    analysisLimit: limit === Infinity ? null : limit,
    totalSynced,
    productsAnalyzed,
    productsLeftToAnalyze,
    remainingInPlan,
  };
}

export async function getAnalyzedProducts(storeId) {
  const store = await Store.findById(storeId);
  if (!store) {
    const error = new Error('Store not found');
    error.code = 'STORE_NOT_FOUND';
    throw error;
  }

  const analyses = await ProductAnalysis.find({ storeId })
    .populate('productId', 'title shopifyProductId handle')
    .sort({ analyzedAt: -1 });

  return analyses;
}

export async function getAnalysisUsage(storeId) {
  const store = await Store.findById(storeId);
  if (!store) {
    const error = new Error('Store not found');
    error.code = 'STORE_NOT_FOUND';
    throw error;
  }

  const limit = getAnalysisLimit(store.plan);
  return buildUsageStats(storeId, store, limit);
}

export async function analyzeProduct(storeId, productId) {
  const store = await Store.findById(storeId);
  if (!store) {
    const error = new Error('Store not found');
    error.code = 'STORE_NOT_FOUND';
    throw error;
  }

  const limit = getAnalysisLimit(store.plan);

  const product = await Product.findOne({ _id: productId, storeId });
  if (!product) {
    const error = new Error('Product not found for this store');
    error.code = 'PRODUCT_NOT_FOUND';
    throw error;
  }

  const alreadyAnalyzed = await ProductAnalysis.exists({ storeId, productId: product._id });
  const uniqueAnalyzedCount = await ProductAnalysis.countDocuments({ storeId });

  if (!alreadyAnalyzed && uniqueAnalyzedCount >= limit) {
    const error = new Error('Plan limit reached for product analysis');
    error.code = 'PLAN_LIMIT_REACHED';
    throw error;
  }

  const result = runSimulatedAnalysis(product);

  // Analysis lives ONLY in productanalyses
  const analysis = await ProductAnalysis.findOneAndUpdate(
    { storeId, productId: product._id },
    {
      storeId,
      productId: product._id,
      shopifyProductId: String(product.shopifyProductId),
      productTitle: product.title,
      score: result.score,
      majorIssues: result.majorIssues,
      suggestedFixes: result.suggestedFixes,
      analyzedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Increment store counter only on first analysis of a product
  if (!alreadyAnalyzed) {
    await Store.findByIdAndUpdate(storeId, {
      $inc: { 'usage.productsAnalyzed': 1 },
    });
  }

  const updatedStore = await Store.findById(storeId);
  const usage = await buildUsageStats(storeId, updatedStore, limit);

  return { analysis, usage, isReanalysis: Boolean(alreadyAnalyzed) };
}
