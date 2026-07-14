import { Schema } from "mongoose";

export const seoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    canonicalUrl: { type: String, trim: true },
    ogImage: { type: String, trim: true },
    robots: { type: String, default: "index, follow" }
  },
  { _id: false }
);

export const auditFields = {
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
};
