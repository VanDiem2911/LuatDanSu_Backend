import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { type UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { AuthService } from "@/application/services/AuthService";
import { MediaModel } from "@/domain/models";
import { connectDatabase } from "@/infrastructure/database/connection";
import { fail, ok } from "@/shared/api";

export const config = {
  api: {
    bodyParser: false
  }
};

const upload = multer({
  storage: (multer as unknown as { memoryStorage: () => ReturnType<typeof multer.diskStorage> }).memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  }
});

function runMulter(req: NextApiRequest, res: NextApiResponse) {
  return new Promise<void>((resolve, reject) => {
    upload.single("file")(req as never, res as never, (error: unknown) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function uploadToCloudinary(file: { buffer: Buffer }, uploadPreset: string) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.unsigned_upload_stream(
      uploadPreset,
      { folder: process.env.CLOUDINARY_FOLDER ?? "luatdansu" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    new AuthService().verify(req.headers.authorization);
    await connectDatabase();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      res.status(500).json({ error: "Cloudinary is not configured" });
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      secure: true
    });

    await runMulter(req, res);

    const file = (req as NextApiRequest & {
      file?: { originalname: string; mimetype: string; size: number; buffer: Buffer };
    }).file;
    if (!file) {
      res.status(422).json({ error: "Image file is required" });
      return;
    }

    const uploadResult = await uploadToCloudinary(file, uploadPreset);

    const media = await MediaModel.create({
      filename: uploadResult.public_id || file.originalname,
      url: uploadResult.secure_url,
      mimeType: file.mimetype,
      size: file.size,
      alt: (req as NextApiRequest & { body?: Record<string, string> }).body?.alt,
      folder: (req as NextApiRequest & { body?: Record<string, string> }).body?.folder ?? "library"
    });

    ok(res, media, 201);
  } catch (error) {
    console.error("[Upload] Handler error:", error);
    fail(res, error);
  }
}
