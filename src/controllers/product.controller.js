import Store from '../models/Store.js';
import Product from '../models/Product.js';
import ProductAnalysis from '../models/ProductAnalysis.js';
import { importProductsForStore as importProductsService } from '../services/shopifyProductImport.service.js';

export const importProductsForStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'storeId is required',
      });
    }

    const result = await importProductsService(storeId);

    const store = await Store.findById(storeId);
    if (store) {
      store.totalProductsSynced = result.imported || 0;
      store.lastSyncedAt = new Date();
      store.isActive = true;
      await store.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Products synced successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error importing products via controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to import products',
    });
  }
};

export const getAllStoredProducts = async (req, res) => {
  try {
    const { storeId } = req.user;

    if (!storeId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: storeId missing from token',
      });
    }

    const products = await Product.find({ storeId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error('Error fetching stored products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stored products',
      error: error.message,
    });
  }
};

export const getSingleStoredProduct = async (req, res) => {
  try {
    const { storeId } = req.user;
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      storeId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message,
    });
  }
};

export const analyzeProduct = async (req, res) => {
  try {
    const { storeId } = req.user;
    const { id } = req.params;

    const product = await Product.findOne({ _id: id, storeId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const title = product.title || '';
    const description = product.description || '';
    const tags = product.tags || [];
    const variants = product.variants || [];

    let score = 0;
    const bestFor = [];
    const intentKeywords = [];
    const missingSignals = [];
    const faq = [];

    if (title.trim()) score += 20;
    else missingSignals.push('Missing product title');

    if (description.trim()) score += 20;
    else missingSignals.push('Missing product description');

    if (tags.length > 0) score += 15;
    else missingSignals.push('Missing product tags');

    if (variants.length > 0) score += 15;
    else missingSignals.push('Missing variant data');

    const descLower = description.toLowerCase();

    if (descLower.includes('protein')) {
      intentKeywords.push('protein');
      bestFor.push('fitness buyers');
    }

    if (descLower.includes('runner')) {
      intentKeywords.push('runner');
      bestFor.push('runners');
    }

    if (descLower.includes('recovery')) {
      intentKeywords.push('recovery');
      bestFor.push('post-workout recovery');
    }

    if (descLower.includes('best')) {
      score += 10;
    } else {
      missingSignals.push('Missing best-for positioning');
    }

    if (!descLower.includes('compare')) {
      missingSignals.push('Missing comparison context');
    }

    faq.push('What problem does this product solve?');
    faq.push('Who is this product best for?');

    const improvedDescription = `
${title}

Best for: ${bestFor.length ? bestFor.join(', ') : 'general use'}

Key intent signals: ${intentKeywords.length ? intentKeywords.join(', ') : 'none detected'}

This product can be improved by adding more use-case, comparison, and trust context.
    `.trim();

    const analysis = await ProductAnalysis.findOneAndUpdate(
      { productId: product._id },
      {
        productId: product._id,
        score,
        bestFor,
        intentKeywords,
        missingSignals,
        faq,
        improvedDescription,
      },
      { upsert: true, new: true }
    );

    product.analysisScore = score;
    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Product analyzed successfully',
      data: analysis,
    });
  } catch (error) {
    console.error('Error analyzing product:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze product',
      error: error.message,
    });
  }
};
