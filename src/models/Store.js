import mongoose from "mongoose"
import CryptoJS from "crypto-js"

const storeSchema = new mongoose.Schema(
  {
    shopDomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, //to optimize field searchability in the database
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
      enum: ["starter", "growth", "agency"],
      default: "starter",
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
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
    isActive: { type: Boolean, default: true },
    installedAt: { type: Date, default: Date.now },
    uninstalledAt: { type: Date, default: null },
  },
  { timestamps: true },
)

// Virtual: decode access token
storeSchema.virtual("accessToken").get(function () {
  if (!this.accessTokenEncrypted) return null
  const key = process.env.ENCRYPTION_KEY
  const bytes = CryptoJS.AES.decrypt(this.accessTokenEncrypted, key)
  return bytes.toString(CryptoJS.enc.Utf8)
})

// Auto-encrypt before save
storeSchema.pre("save", function (next) {
  if (this.isModified("accessTokenEncrypted")) return next()
  next()
})

// Helper: encrypt and set token
storeSchema.methods.setAccessToken = function (plainToken) {
  const key = process.env.ENCRYPTION_KEY
  this.accessTokenEncrypted = CryptoJS.AES.encrypt(plainToken, key).toString()
}

// Check plan features
storeSchema.methods.hasFeature = function (feature) {
  const features = {
    starter: ["analyze", "optimize"],
    growth: [
      "analyze",
      "optimize",
      "simulate",
      "promptIntelligence",
      "competitorGap",
    ],
    agency: [
      "analyze",
      "optimize",
      "simulate",
      "promptIntelligence",
      "competitorGap",
      "whiteLabel",
      "multiStore",
    ],
  }
  return (features[this.plan] || []).includes(feature)
}

const Store = mongoose.model("Store", storeSchema)
export default Store