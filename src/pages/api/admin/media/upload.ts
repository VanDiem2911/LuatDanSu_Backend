import fs from "node:fs";
import path from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { AuthService } from "@/application/services/AuthService";
import { MediaModel } from "@/domain/models";
import { connectDatabase } from "@/infrastructure/database/connection";
import { fail, ok } from "@/shared/api";

export const config = {
  api: {
    bodyParser: false
  }
};

const uploadRoot = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadRoot,
    filename: (_req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
      callback(null, `${Date.now()}-${safeName}`);
    }
  }),
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
    await runMulter(req, res);

    const file = (req as NextApiRequest & {
      file?: { filename: string; mimetype: string; size: number; path: string };
    }).file;
    if (!file) {
      res.status(422).json({ error: "Image file is required" });
      return;
    }

    let fileUrl = `/api/uploads/${file.filename}`;

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (cloudName && uploadPreset) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          secure: true
        });

        const folder = process.env.CLOUDINARY_FOLDER ?? "luatdansu";
        console.log(`[Cloudinary] Uploading to cloud: ${cloudName}, preset: ${uploadPreset}, folder: ${folder}`);

        const uploadResult = await cloudinary.uploader.unsigned_upload(file.path, uploadPreset, {
          folder
        });

        fileUrl = uploadResult.secure_url;
        console.log(`[Cloudinary] Upload success: ${fileUrl}`);

        try {
          fs.unlinkSync(file.path);
        } catch {
          // ignore temp file cleanup error
        }
      } catch (cloudErr) {
        console.error("[Cloudinary] Upload failed:", cloudErr);
        // Fall back to local URL, don't crash
        console.warn("[Cloudinary] Falling back to local file storage.");
      }
    } else {
      console.warn("[Cloudinary] Config missing (CLOUDINARY_CLOUD_NAME or CLOUDINARY_UPLOAD_PRESET). Using local storage.");
    }

    const media = await MediaModel.create({
      filename: file.filename,
      url: fileUrl,
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
