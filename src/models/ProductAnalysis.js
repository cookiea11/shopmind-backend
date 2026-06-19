// This script defines the Mongoose schema and model for mock product analysis results in the application.
import mongoose from 'mongoose';

const productAnalysisSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // major issues, not every signal
    majorIssues: {
      type: [String],
      default: [],
    },//empty arrays for now
    suggestedFixes: {
      type: [String],
      default: [],
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One analysis record per product per store (re-analyze overwrites)
productAnalysisSchema.index({ storeId: 1, productId: 1 }, { unique: true });

const ProductAnalysis = mongoose.model('ProductAnalysis', productAnalysisSchema);
export default ProductAnalysis;