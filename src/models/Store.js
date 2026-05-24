import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    shopDomain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'growth', 'agency'],
      default: 'starter',
    },
  },
  { timestamps: true }
);

const Store = mongoose.model('Store', storeSchema);

export default Store;