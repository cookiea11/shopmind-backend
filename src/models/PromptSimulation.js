import mongoose from 'mongoose';

const promptSimulationSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    recommendationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    missingSignals: {
      type: [String],
      default: [],
    },
    competitorStrength: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const PromptSimulation = mongoose.model('PromptSimulation', promptSimulationSchema);

export default PromptSimulation;