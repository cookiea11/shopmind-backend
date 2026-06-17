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
    shopifyProductId: {
      type: String,
      required: true,
    },
    productTitle: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    majorIssues: {
      type: [String],
      default: [],
    },
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

productAnalysisSchema.index({ storeId: 1, productId: 1 }, { unique: true });

const ProductAnalysis = mongoose.model('ProductAnalysis', productAnalysisSchema);

export default ProductAnalysis;
