import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema(
  {
    shopDomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Access token is AES-encrypted at rest
    accessTokenEncrypted: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ["starter", "growth", "pro", "agency"],
      default: "starter",
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    addons: {
      promptTracking: { type: Boolean, default: false },
      aiVisibilityAudit: { type: Boolean, default: false },
      aiVisibilityAuditAt: { type: Date, default: null },
    },
    // Token usage tracking (resets monthly)
    monthlyTokenQuota: { type: Number, default: 0 }, // Max tokens per month for this plan
    tokensUsedThisMonth: { type: Number, default: 0 }, // Tokens used in current month
    tokenQuotaResetDate: { type: Date, default: Date.now }, // When the monthly quota resets
    lifetimeTokensUsed: { type: Number, default: 0 }, // Total tokens used (all time)
    shopName: {
      type: String,
      default: null,
    },
    shopEmail: {
      type: String,
      default: null,
    },
    shopOwner: {
      type: String,
      default: null,
    },
    currency: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: null,
    },
    totalProductsSynced: { type: Number, default: 0 },
    lastSyncedAt: { type: Date, default: null },
    // Plan usage counters (products analyzed, prompts generated)
    usage: {
      productsAnalyzed: { type: Number, default: 0 },
      manualPromptsGenerated: { type: Number, default: 0 },
      autoPromptsGenerated: { type: Number, default: 0 },
    },
    // FAQ storage preference: auto | inline | metafield
    faqStrategy: {
      type: String,
      enum: ["auto", "inline", "metafield"],
      default: "auto",
    },
    isActive: { type: Boolean, default: true },
    installedAt: { type: Date, default: Date.now },
    uninstalledAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Store = mongoose.model('Store', storeSchema);
export default Store;