declare module "multer" {
  import type { RequestHandler } from "express";

  type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

  type File = {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
  };

  type StorageEngine = unknown;

  type MulterOptions = {
    storage?: StorageEngine;
    limits?: Record<string, number>;
    fileFilter?: (req: unknown, file: File, callback: FileFilterCallback) => void;
  };

  type Multer = {
    single(fieldName: string): RequestHandler;
  };

  type MulterFactory = {
    (options?: MulterOptions): Multer;
    diskStorage(options: {
      destination: string;
      filename: (req: unknown, file: File, callback: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;
  };

  const multer: MulterFactory;
  export = multer;
}
