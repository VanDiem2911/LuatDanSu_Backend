import mongoose, { Schema } from "mongoose";
import { seoSchema } from "./common";

const menuSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, enum: ["header", "footer", "mobile"], required: true },
    items: [
      {
        label: String,
        href: String,
        order: Number,
        isExternal: Boolean
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const pageSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: String,
    content: { type: String, required: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    seo: seoSchema
  },
  { timestamps: true }
);

const settingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    group: { type: String, default: "general" },
    isPublic: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const mediaSchema = new Schema(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: String,
    size: Number,
    alt: String,
    folder: { type: String, default: "library" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const bannerSchema = new Schema(
  {
    title: { type: String, required: true },
    placement: { type: String, enum: ["home", "category", "article", "sidebar"], required: true },
    image: { type: String, required: true },
    href: String,
    description: String,
    isActive: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date
  },
  { timestamps: true }
);

const commentSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, ref: "Article", index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "spam"], default: "pending" }
  },
  { timestamps: true }
);

const leadSchema = new Schema(
  {
    phone: { type: String, required: true },
    source: { type: String, default: "website" },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" }
  },
  { timestamps: true }
);

const videoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, trim: true, unique: true, index: true },
    order: { type: Number, default: 0, index: true },
    isHidden: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export const MenuModel = mongoose.models.Menu || mongoose.model("Menu", menuSchema);
export const PageModel = mongoose.models.Page || mongoose.model("Page", pageSchema);
export const SettingModel = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
export const MediaModel = mongoose.models.Media || mongoose.model("Media", mediaSchema);
export const BannerModel = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
export const CommentModel = mongoose.models.Comment || mongoose.model("Comment", commentSchema);
export const LeadModel = mongoose.models.Lead || mongoose.model("Lead", leadSchema);
export const VideoModel = mongoose.models.Video || mongoose.model("Video", videoSchema);
