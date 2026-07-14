import mongoose, { Schema, type InferSchemaType } from "mongoose";

const tagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

export type TagDocument = InferSchemaType<typeof tagSchema>;
export const TagModel = mongoose.models.Tag || mongoose.model("Tag", tagSchema);
