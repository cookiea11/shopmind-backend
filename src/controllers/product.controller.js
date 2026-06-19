// This script defines the controller functions for handling product-related API requests, including importing products from Shopify and fetching stored products from the database.

import Store from '../models/Store.js';
import Product from '../models/Product.js';
import { importProductsForStore as importProductsService } from '../services/shopifyProductImport.service.js';

// Controller functions for handling product-related API requests, including importing products from Shopify and fetching stored products from the database.
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
      store.totalProductsSynced = result.totalInDb ?? result.imported ?? 0;
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
