import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { seoSchema } from "./common";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true },
    type: { type: String, enum: ["category", "specialty"], default: "category" },
    parentSlug: { type: String, trim: true },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    seo: seoSchema
  },
  { timestamps: true }
);

export type CategoryDocument = InferSchemaType<typeof categorySchema>;
export const CategoryModel =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
