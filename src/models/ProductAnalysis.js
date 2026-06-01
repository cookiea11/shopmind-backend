import mongoose from 'mongoose';

const productAnalysisSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    bestFor: {
      type: [String],
      default: [],
    },
    intentKeywords: {
      type: [String],
      default: [],
    },
    missingSignals: {
      type: [String],
      default: [],
    },
    faq: {
      type: [String],
      default: [],
    },
    improvedDescription: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const ProductAnalysis = mongoose.model('ProductAnalysis', productAnalysisSchema);

export default ProductAnalysis;