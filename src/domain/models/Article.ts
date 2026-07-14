import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { auditFields, seoSchema } from "./common";

const articleSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: "text" },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    categorySlug: { type: String, required: true, index: true },
    tagSlugs: [{ type: String, trim: true, index: true }],
    image: { type: String, trim: true },
    authorName: { type: String, default: "Ban Biên Tập" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft", index: true },
    featured: { type: Boolean, default: false, index: true },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date },
    seo: seoSchema,
    ...auditFields
  },
  { timestamps: true }
);

articleSchema.index({ title: "text", excerpt: "text", content: "text" });
articleSchema.index({ categorySlug: 1, status: 1, publishedAt: -1 });

export type ArticleDocument = InferSchemaType<typeof articleSchema>;
export const ArticleModel =
  mongoose.models.Article || mongoose.model("Article", articleSchema);
