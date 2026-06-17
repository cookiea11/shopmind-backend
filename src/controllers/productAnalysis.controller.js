import {
  analyzeProduct,
  getAnalysisUsage,
  getAnalyzedProducts,
} from '../services/shopifyProductAnalysisService.js';

function assertStoreAccess(req, res) {
  const { storeId } = req.params;
  const tokenStoreId = req.user?.storeId;

  if (!tokenStoreId || String(tokenStoreId) !== String(storeId)) {
    res.status(403).json({
      success: false,
      message: 'Not authorized to access this store',
    });
    return false;
  }

  return true;
}

export async function getAnalysisUsageController(req, res) {
  try {
    if (!assertStoreAccess(req, res)) return;

    const { storeId } = req.params;
    const usage = await getAnalysisUsage(storeId);

    return res.status(200).json({
      success: true,
      data: usage,
    });
  } catch (error) {
    if (error.code === 'STORE_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }

    console.error('Analysis usage error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAnalyzedProductsController(req, res) {
  try {
    if (!assertStoreAccess(req, res)) return;

    const { storeId } = req.params;
    const analyses = await getAnalyzedProducts(storeId);

    return res.status(200).json({
      success: true,
      count: analyses.length,
      data: analyses,
    });
  } catch (error) {
    if (error.code === 'STORE_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }

    console.error('List analyzed products error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function analyzeProductController(req, res) {
  try {
    if (!assertStoreAccess(req, res)) return;

    const { storeId, productId } = req.params;
    const { analysis, usage, isReanalysis } = await analyzeProduct(storeId, productId);

    return res.status(200).json({
      success: true,
      usage,
      data: {
        productId: analysis.productId,
        shopifyProductId: analysis.shopifyProductId,
        productTitle: analysis.productTitle,
        score: analysis.score,
        majorIssues: analysis.majorIssues,
        suggestedFixes: analysis.suggestedFixes,
        analyzedAt: analysis.analyzedAt,
        isReanalysis,
      },
    });
  } catch (error) {
    if (error.code === 'PLAN_LIMIT_REACHED') {
      return res.status(403).json({
        success: false,
        message:
          'You have reached your plan limit for product analysis. Upgrade your plan to analyse more products.',
      });
    }

    if (error.code === 'STORE_NOT_FOUND' || error.code === 'PRODUCT_NOT_FOUND') {
      return res.status(404).json({ success: false, message: error.message });
    }

    console.error('Product analysis error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
